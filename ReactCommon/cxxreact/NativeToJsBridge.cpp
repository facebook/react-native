// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeToJsBridge.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceAsyncFlow;
#endif

#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/MoveWrapper.h>

#include "Instance.h"
#include "ModuleRegistry.h"
#include "Platform.h"
#include "SystraceSection.h"

namespace facebook {
namespace react {

// This class manages calls from JS to native code.
class JsToNativeBridge : public react::ExecutorDelegate {
public:
  JsToNativeBridge(NativeToJsBridge* nativeToJs,
                   std::shared_ptr<ModuleRegistry> registry,
                   std::unique_ptr<MessageQueueThread> nativeQueue,
                   std::shared_ptr<InstanceCallback> callback)
    : m_nativeToJs(nativeToJs)
    , m_registry(registry)
    , m_nativeQueue(std::move(nativeQueue))
    , m_callback(callback) {}

  void registerExecutor(std::unique_ptr<JSExecutor> executor,
                        std::shared_ptr<MessageQueueThread> queue) override {
    m_nativeToJs->registerExecutor(m_callback->createExecutorToken(), std::move(executor), queue);
  }

  std::unique_ptr<JSExecutor> unregisterExecutor(JSExecutor& executor) override {
    m_callback->onExecutorStopped(m_nativeToJs->getTokenForExecutor(executor));
    return m_nativeToJs->unregisterExecutor(executor);
  }

  std::shared_ptr<ModuleRegistry> getModuleRegistry() override {
    return m_registry;
  }

  void callNativeModules(
      JSExecutor& executor, folly::dynamic&& calls, bool isEndOfBatch) override {
    ExecutorToken token = m_nativeToJs->getTokenForExecutor(executor);
    m_nativeQueue->runOnQueue([this, token, calls=std::move(calls), isEndOfBatch] () mutable {
      m_batchHadNativeModuleCalls = m_batchHadNativeModuleCalls || !calls.empty();

      // An exception anywhere in here stops processing of the batch.  This
      // was the behavior of the Android bridge, and since exception handling
      // terminates the whole bridge, there's not much point in continuing.
      for (auto& call : react::parseMethodCalls(std::move(calls))) {
        m_registry->callNativeMethod(
          token, call.moduleId, call.methodId, std::move(call.arguments), call.callId);
      }
      if (isEndOfBatch) {
        if (m_batchHadNativeModuleCalls) {
          m_callback->onBatchComplete();
          m_batchHadNativeModuleCalls = false;
        }
        m_callback->decrementPendingJSCalls();
      }
    });
  }

  MethodCallResult callSerializableNativeHook(
      JSExecutor& executor, unsigned int moduleId, unsigned int methodId,
      folly::dynamic&& args) override {
    ExecutorToken token = m_nativeToJs->getTokenForExecutor(executor);
    return m_registry->callSerializableNativeHook(token, moduleId, methodId, std::move(args));
  }

  void quitQueueSynchronous() {
    m_nativeQueue->quitSynchronous();
  }

private:

  // These methods are always invoked from an Executor.  The NativeToJsBridge
  // keeps a reference to the root executor, and when destroy() is
  // called, the Executors are all destroyed synchronously on their
  // bridges.  So, the bridge pointer will will always point to a
  // valid object during a call to a delegate method from an exectuto.
  NativeToJsBridge* m_nativeToJs;
  std::shared_ptr<ModuleRegistry> m_registry;
  std::unique_ptr<MessageQueueThread> m_nativeQueue;
  std::shared_ptr<InstanceCallback> m_callback;
  bool m_batchHadNativeModuleCalls = false;
};

NativeToJsBridge::NativeToJsBridge(
    JSExecutorFactory* jsExecutorFactory,
    std::shared_ptr<ModuleRegistry> registry,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<InstanceCallback> callback)
    : m_destroyed(std::make_shared<bool>(false))
    , m_mainExecutorToken(callback->createExecutorToken())
    , m_delegate(
      std::make_shared<JsToNativeBridge>(
        this, registry, std::move(nativeQueue), callback)) {
  std::unique_ptr<JSExecutor> mainExecutor =
    jsExecutorFactory->createJSExecutor(m_delegate, jsQueue);
  // cached to avoid locked map lookup in the common case
  m_mainExecutor = mainExecutor.get();
  registerExecutor(m_mainExecutorToken, std::move(mainExecutor), jsQueue);
}

// This must be called on the same thread on which the constructor was called.
NativeToJsBridge::~NativeToJsBridge() {
  CHECK(*m_destroyed) <<
    "NativeToJsBridge::destroy() must be called before deallocating the NativeToJsBridge!";
}

void NativeToJsBridge::loadApplication(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {
  runOnExecutorQueue(
      m_mainExecutorToken,
      [unbundleWrap=folly::makeMoveWrapper(std::move(unbundle)),
       startupScript=folly::makeMoveWrapper(std::move(startupScript)),
       startupScriptSourceURL=std::move(startupScriptSourceURL)]
        (JSExecutor* executor) mutable {

    auto unbundle = unbundleWrap.move();
    if (unbundle) {
      executor->setJSModulesUnbundle(std::move(unbundle));
    }
    executor->loadApplicationScript(std::move(*startupScript),
                                    std::move(startupScriptSourceURL));
  });
}

void NativeToJsBridge::loadApplicationSync(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {
  if (unbundle) {
    m_mainExecutor->setJSModulesUnbundle(std::move(unbundle));
  }
  m_mainExecutor->loadApplicationScript(std::move(startupScript),
                                        std::move(startupScriptSourceURL));
}

void NativeToJsBridge::callFunction(
    ExecutorToken executorToken,
    std::string&& module,
    std::string&& method,
    folly::dynamic&& arguments) {
  int systraceCookie = -1;
  #ifdef WITH_FBSYSTRACE
  systraceCookie = m_systraceCookie++;
  std::string tracingName = fbsystrace_is_tracing(TRACE_TAG_REACT_CXX_BRIDGE) ?
    folly::to<std::string>("JSCall__", module, '_', method) : std::string();
  SystraceSection s(tracingName.c_str());
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      tracingName.c_str(),
      systraceCookie);
  #else
  std::string tracingName;
  #endif

  runOnExecutorQueue(executorToken, [module = std::move(module), method = std::move(method), arguments = std::move(arguments), tracingName = std::move(tracingName), systraceCookie] (JSExecutor* executor) {
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
    executor->callFunction(module, method, arguments);
  });
}

void NativeToJsBridge::invokeCallback(ExecutorToken executorToken, double callbackId, folly::dynamic&& arguments) {
  int systraceCookie = -1;
  #ifdef WITH_FBSYSTRACE
  systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      "<callback>",
      systraceCookie);
  #endif

  runOnExecutorQueue(executorToken, [callbackId, arguments = std::move(arguments), systraceCookie] (JSExecutor* executor) {
    #ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        "<callback>",
        systraceCookie);
    SystraceSection s("NativeToJsBridge.invokeCallback");
    #endif

    executor->invokeCallback(callbackId, arguments);
  });
}

void NativeToJsBridge::setGlobalVariable(std::string propName,
                                         std::unique_ptr<const JSBigString> jsonValue) {
  runOnExecutorQueue(
    m_mainExecutorToken,
    [propName=std::move(propName), jsonValue=folly::makeMoveWrapper(std::move(jsonValue))]
    (JSExecutor* executor) mutable {
      executor->setGlobalVariable(propName, jsonValue.move());
    });
}

void* NativeToJsBridge::getJavaScriptContext() {
  // TODO(cjhopman): this seems unsafe unless we require that it is only called on the main js queue.
  return m_mainExecutor->getJavaScriptContext();
}

bool NativeToJsBridge::supportsProfiling() {
  // Intentionally doesn't post to jsqueue. supportsProfiling() can be called from any thread.
  return m_mainExecutor->supportsProfiling();
}

void NativeToJsBridge::startProfiler(const std::string& title) {
  runOnExecutorQueue(m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->startProfiler(title);
  });
}

void NativeToJsBridge::stopProfiler(const std::string& title, const std::string& filename) {
  runOnExecutorQueue(m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->stopProfiler(title, filename);
  });
}

void NativeToJsBridge::handleMemoryPressureUiHidden() {
  runOnExecutorQueue(m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->handleMemoryPressureUiHidden();
  });
}

void NativeToJsBridge::handleMemoryPressureModerate() {
  runOnExecutorQueue(m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->handleMemoryPressureModerate();
  });
}

void NativeToJsBridge::handleMemoryPressureCritical() {
  runOnExecutorQueue(m_mainExecutorToken, [=] (JSExecutor* executor) {
    executor->handleMemoryPressureCritical();
  });
}

ExecutorToken NativeToJsBridge::getMainExecutorToken() const {
  return m_mainExecutorToken;
}

ExecutorToken NativeToJsBridge::registerExecutor(
    ExecutorToken token,
    std::unique_ptr<JSExecutor> executor,
    std::shared_ptr<MessageQueueThread> messageQueueThread) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);

  CHECK(m_executorTokenMap.find(executor.get()) == m_executorTokenMap.end())
      << "Trying to register an already registered executor!";

  m_executorTokenMap.emplace(executor.get(), token);
  m_executorMap.emplace(
      token,
      ExecutorRegistration(std::move(executor), messageQueueThread));

  return token;
}

std::unique_ptr<JSExecutor> NativeToJsBridge::unregisterExecutor(JSExecutor& executor) {
  std::unique_ptr<JSExecutor> ret;

  {
    std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);

    auto it = m_executorTokenMap.find(&executor);
    CHECK(it != m_executorTokenMap.end())
        << "Trying to unregister an executor that was never registered!";
    auto it2 = m_executorMap.find(it->second);
    ret = std::move(it2->second.executor_);

    m_executorTokenMap.erase(it);
    m_executorMap.erase(it2);
  }

  return ret;
}

MessageQueueThread* NativeToJsBridge::getMessageQueueThread(const ExecutorToken& executorToken) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  auto it = m_executorMap.find(executorToken);
  if (it == m_executorMap.end()) {
    return nullptr;
  }
  return it->second.messageQueueThread_.get();
}

JSExecutor* NativeToJsBridge::getExecutor(const ExecutorToken& executorToken) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  auto it = m_executorMap.find(executorToken);
  if (it == m_executorMap.end()) {
    return nullptr;
  }
  return it->second.executor_.get();
}

ExecutorToken NativeToJsBridge::getTokenForExecutor(JSExecutor& executor) {
  std::lock_guard<std::mutex> registrationGuard(m_registrationMutex);
  return m_executorTokenMap.at(&executor);
}

void NativeToJsBridge::destroy() {
  m_delegate->quitQueueSynchronous();
  auto* executorMessageQueueThread = getMessageQueueThread(m_mainExecutorToken);
  // All calls made through runOnExecutorQueue have an early exit if
  // m_destroyed is true. Setting this before the runOnQueueSync will cause
  // pending work to be cancelled and we won't have to wait for it.
  *m_destroyed = true;
  executorMessageQueueThread->runOnQueueSync([this, executorMessageQueueThread] {
    m_mainExecutor->destroy();
    executorMessageQueueThread->quitSynchronous();
    unregisterExecutor(*m_mainExecutor);
    m_mainExecutor = nullptr;
  });
}

void NativeToJsBridge::runOnExecutorQueue(ExecutorToken executorToken, std::function<void(JSExecutor*)> task) {
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
