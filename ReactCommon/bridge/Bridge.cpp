// Copyright 2004-present Facebook. All Rights Reserved.

#include "Bridge.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceAsyncFlow;
#endif

#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/MoveWrapper.h>

#include "Platform.h"
#include "SystraceSection.h"

namespace facebook {
namespace react {

Bridge::Bridge(
    JSExecutorFactory* jsExecutorFactory,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<ExecutorTokenFactory> executorTokenFactory,
    std::unique_ptr<BridgeCallback> callback) :
  m_callback(std::move(callback)),
  m_destroyed(std::make_shared<bool>(false)),
  m_executorTokenFactory(std::move(executorTokenFactory)) {
  std::unique_ptr<JSExecutor> mainExecutor = jsExecutorFactory->createJSExecutor(this, jsQueue);
  // cached to avoid locked map lookup in the common case
  m_mainExecutor = mainExecutor.get();
  m_mainExecutorToken = folly::make_unique<ExecutorToken>(registerExecutor(
      std::move(mainExecutor), jsQueue));
}

// This must be called on the same thread on which the constructor was called.
Bridge::~Bridge() {
  CHECK(*m_destroyed) << "Bridge::destroy() must be called before deallocating the Bridge!";
}

void Bridge::loadApplicationScript(std::unique_ptr<const JSBigString> script,
                                   std::string sourceURL) {
  // TODO(t11144533): Add assert that we are on the correct thread
  m_mainExecutor->loadApplicationScript(std::move(script), std::move(sourceURL));
}

void Bridge::loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {
  runOnExecutorQueue(
      *m_mainExecutorToken,
      [unbundle=folly::makeMoveWrapper(std::move(unbundle)),
       startupScript=folly::makeMoveWrapper(std::move(startupScript)),
       startupScriptSourceURL=std::move(startupScriptSourceURL)]
        (JSExecutor* executor) mutable {

    executor->setJSModulesUnbundle(unbundle.move());
    executor->loadApplicationScript(std::move(*startupScript),
                                    std::move(startupScriptSourceURL));
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

  runOnExecutorQueue(executorToken, [moduleId, methodId, arguments, tracingName, systraceCookie] (JSExecutor* executor) {
    #ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        tracingName.c_str(),
        systraceCookie);
    SystraceSection s(tracingName.c_str());
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

  runOnExecutorQueue(executorToken, [callbackId, arguments, systraceCookie] (JSExecutor* executor) {
    #ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        "<callback>",
        systraceCookie);
    SystraceSection s("Bridge.invokeCallback");
    #endif

    executor->invokeCallback(callbackId, arguments);
  });
}

void Bridge::setGlobalVariable(std::string propName,
                               std::unique_ptr<const JSBigString> jsonValue) {
  runOnExecutorQueue(
    *m_mainExecutorToken,
    [propName=std::move(propName), jsonValue=folly::makeMoveWrapper(std::move(jsonValue))]
    (JSExecutor* executor) mutable {
      executor->setGlobalVariable(propName, jsonValue.move());
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
  // This is called by the executor and thus runs on the executor's own queue.
  // This means that the executor has not yet been unregistered (and we are
  // guaranteed to be able to get the token).
  m_callback->onCallNativeModules(getTokenForExecutor(executor), callJSON, isEndOfBatch);
}

MethodCallResult Bridge::callSerializableNativeHook(unsigned int moduleId, unsigned int methodId, const std::string& argsJSON) {
  return m_callback->callSerializableNativeHook(*m_mainExecutorToken, moduleId, methodId, folly::parseJson(argsJSON));
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
  auto executorMessageQueueThread = getMessageQueueThread(*m_mainExecutorToken);
  executorMessageQueueThread->runOnQueueSync([this, &executorMessageQueueThread] {
    executorMessageQueueThread->quitSynchronous();
    *m_destroyed = true;
    m_mainExecutor = nullptr;
    std::unique_ptr<JSExecutor> mainExecutor = unregisterExecutor(*m_mainExecutorToken);
    mainExecutor->destroy();
  });
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
