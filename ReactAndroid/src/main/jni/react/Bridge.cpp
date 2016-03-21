// Copyright 2004-present Facebook. All Rights Reserved.

#include "Bridge.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
using fbsystrace::FbSystraceAsyncFlow;
#endif
#include <folly/Memory.h>

#include "Platform.h"

namespace facebook {
namespace react {

Bridge::Bridge(
    JSExecutorFactory* jsExecutorFactory,
    std::unique_ptr<ExecutorTokenFactory> executorTokenFactory,
    std::unique_ptr<BridgeCallback> callback) :
  m_callback(std::move(callback)),
  m_destroyed(std::make_shared<bool>(false)),
  m_executorTokenFactory(std::move(executorTokenFactory)) {
  std::unique_ptr<JSExecutor> mainExecutor = jsExecutorFactory->createJSExecutor(this);
  // cached to avoid locked map lookup in the common case
  m_mainExecutor = mainExecutor.get();
  m_mainExecutorToken = folly::make_unique<ExecutorToken>(registerExecutor(
      std::move(mainExecutor),
      MessageQueues::getCurrentMessageQueueThread()));
}

// This must be called on the same thread on which the constructor was called.
Bridge::~Bridge() {
  CHECK(*m_destroyed) << "Bridge::destroy() must be called before deallocating the Bridge!";
}

void Bridge::loadApplicationScript(const std::string& script, const std::string& sourceURL) {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->loadApplicationScript(script, sourceURL);
  });
}

void Bridge::loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) {
  runOnExecutorQueue(
      *m_mainExecutorToken,
      [holder=std::make_shared<std::unique_ptr<JSModulesUnbundle>>(std::move(unbundle)), startupCode, sourceURL]
        (JSExecutor* executor) mutable {
    executor->loadApplicationUnbundle(std::move(*holder), startupCode, sourceURL);
  });
}

void Bridge::callFunction(
    ExecutorToken executorToken,
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments,
    const std::string& tracingName) {
  #ifdef WITH_FBSYSTRACE
  int systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      tracingName.c_str(),
      systraceCookie);
  #endif

  #ifdef WITH_FBSYSTRACE
  runOnExecutorQueue(executorToken, [moduleId, methodId, arguments, tracingName, systraceCookie] (JSExecutor* executor) {
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        tracingName.c_str(),
        systraceCookie);
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, tracingName.c_str());
  #else
  runOnExecutorQueue(executorToken, [moduleId, methodId, arguments, tracingName] (JSExecutor* executor) {
  #endif
    // This is safe because we are running on the executor's thread: it won't
    // destruct until after it's been unregistered (which we check above) and
    // that will happen on this thread
    executor->callFunction(moduleId, methodId, arguments);
  });
}

void Bridge::invokeCallback(ExecutorToken executorToken, const double callbackId, const folly::dynamic& arguments) {
  #ifdef WITH_FBSYSTRACE
  int systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      "<callback>",
      systraceCookie);
  #endif

  #ifdef WITH_FBSYSTRACE
  runOnExecutorQueue(executorToken, [callbackId, arguments, systraceCookie] (JSExecutor* executor) {
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        "<callback>",
        systraceCookie);
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.invokeCallback");
  #else
  runOnExecutorQueue(executorToken, [callbackId, arguments] (JSExecutor* executor) {
  #endif
    executor->invokeCallback(callbackId, arguments);
  });
}

void Bridge::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->setGlobalVariable(propName, jsonValue);
  });
}

void* Bridge::getJavaScriptContext() {
  // TODO(cjhopman): this seems unsafe unless we require that it is only called on the main js queue.
  return m_mainExecutor->getJavaScriptContext();
}

bool Bridge::supportsProfiling() {
  // Intentionally doesn't post to jsqueue. supportsProfiling() can be called from any thread.
  return m_mainExecutor->supportsProfiling();
}

void Bridge::startProfiler(const std::string& title) {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->startProfiler(title);
  });
}

void Bridge::stopProfiler(const std::string& title, const std::string& filename) {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->stopProfiler(title, filename);
  });
}

void Bridge::handleMemoryPressureModerate() {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->handleMemoryPressureModerate();
  });
}

void Bridge::handleMemoryPressureCritical() {
  runOnExecutorQueue(*m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->handleMemoryPressureCritical();
  });
}

void Bridge::callNativeModules(JSExecutor& executor, const std::string& callJSON, bool isEndOfBatch) {
  m_callback->onCallNativeModules(getTokenForExecutor(executor), callJSON, isEndOfBatch);
}

ExecutorToken Bridge::getMainExecutorToken() const {
  return *m_mainExecutorToken.get();
}

ExecutorToken Bridge::registerExecutor(
    std::unique_ptr<JSExecutor> executor,
    std::shared_ptr<MessageQueueThread> messageQueueThread) {
  auto token = m_executorTokenFactory->createExecutorToken();

  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);

  CHECK(m_executorTokenMap.find(executor.get()) == m_executorTokenMap.end())
      << "Trying to register an already registered executor!";

  m_executorTokenMap.emplace(executor.get(), token);
  m_executorMap.emplace(
      token,
      folly::make_unique<ExecutorRegistration>(std::move(executor), std::move(messageQueueThread)));

  return token;
}

std::unique_ptr<JSExecutor> Bridge::unregisterExecutor(ExecutorToken executorToken) {
  std::unique_ptr<JSExecutor> executor;

  {
    std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);

    auto it = m_executorMap.find(executorToken);
    CHECK(it != m_executorMap.end())
        << "Trying to unregister an executor that was never registered!";

    executor = std::move(it->second->executor_);
    m_executorMap.erase(it);
    m_executorTokenMap.erase(executor.get());
  }

  m_callback->onExecutorUnregistered(executorToken);

  return executor;
}

MessageQueueThread* Bridge::getMessageQueueThread(const ExecutorToken& executorToken) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  auto it = m_executorMap.find(executorToken);
  if (it == m_executorMap.end()) {
    return nullptr;
  }
  return it->second->messageQueueThread_.get();
}

JSExecutor* Bridge::getExecutor(const ExecutorToken& executorToken) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  auto it = m_executorMap.find(executorToken);
  if (it == m_executorMap.end()) {
    return nullptr;
  }
  return it->second->executor_.get();
}

ExecutorToken Bridge::getTokenForExecutor(JSExecutor& executor) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  return m_executorTokenMap.at(&executor);
}

void Bridge::destroy() {
  *m_destroyed = true;
  m_mainExecutor = nullptr;
  std::unique_ptr<JSExecutor> mainExecutor = unregisterExecutor(*m_mainExecutorToken);
  mainExecutor->destroy();
}

void Bridge::runOnExecutorQueue(ExecutorToken executorToken, std::function<void(JSExecutor*)> task) {
  if (*m_destroyed) {
    return;
  }

  auto executorMessageQueueThread = getMessageQueueThread(executorToken);
  if (executorMessageQueueThread == nullptr) {
    LOG(WARNING) << "Dropping JS action for executor that has been unregistered...";
    return;
  }

  std::shared_ptr<bool> isDestroyed = m_destroyed;
  executorMessageQueueThread->runOnQueue([this, isDestroyed, executorToken, task=std::move(task)] {
    if (*isDestroyed) {
      return;
    }

    JSExecutor *executor = getExecutor(executorToken);
    if (executor == nullptr) {
      LOG(WARNING) << "Dropping JS call for executor that has been unregistered...";
      return;
    }

    // The executor is guaranteed to be valid for the duration of the task because:
    // 1. the executor is only destroyed after it is unregistered
    // 2. the executor is unregistered on this queue
    // 3. we just confirmed that the executor hasn't been unregistered above
    task(executor);
  });
}

} }
