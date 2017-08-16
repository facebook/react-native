// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <atomic>
#include <functional>
#include <map>
#include <vector>

#include <cxxreact/JSCExecutor.h>
#include <cxxreact/JSExecutor.h>

namespace folly {
struct dynamic;
}

namespace facebook {
namespace react {

struct InstanceCallback;
class JSModulesUnbundle;
class JsToNativeBridge;
class MessageQueueThread;
class ModuleRegistry;

// This class manages calls from native code to JS.  It also manages
// executors and their threads.  All functions here can be called from
// any thread.
//
// Except for loadApplicationScriptSync(), all void methods will queue
// work to run on the jsQueue passed to the ctor, and return
// immediately.
class NativeToJsBridge {
public:
  friend class JsToNativeBridge;

  /**
   * This must be called on the main JS thread.
   */
  NativeToJsBridge(
      JSExecutorFactory* jsExecutorFactory,
      std::shared_ptr<ModuleRegistry> registry,
      std::shared_ptr<MessageQueueThread> jsQueue,
      std::shared_ptr<InstanceCallback> callback);
  virtual ~NativeToJsBridge();

  /**
   * Executes a function with the module ID and method ID and any additional
   * arguments in JS.
   */
  void callFunction(std::string&& module, std::string&& method, folly::dynamic&& args);

  /**
   * Invokes a callback with the cbID, and optional additional arguments in JS.
   */
  void invokeCallback(double callbackId, folly::dynamic&& args);

  /**
   * Executes a JS method on the given executor synchronously, returning its
   * return value.  JSException will be thrown if JS throws an exception;
   * another standard exception may be thrown for C++ bridge failures, or if
   * the executor is not capable of synchronous calls.
   *
   * This method is experimental, and may be modified or removed.
   *
   * loadApplicationScriptSync() must be called and finished executing
   * before callFunctionSync().
   */
  template <typename T>
  Value callFunctionSync(const std::string& module, const std::string& method, T&& args) {
    if (*m_destroyed) {
      throw std::logic_error(
        folly::to<std::string>("Synchronous call to ", module, ".", method,
                               " after bridge is destroyed"));
    }

    JSCExecutor *jscExecutor = dynamic_cast<JSCExecutor*>(m_executor.get());
    if (!jscExecutor) {
      throw std::invalid_argument(
        folly::to<std::string>("Executor type ", typeid(m_executor.get()).name(),
                               " does not support synchronous calls"));
    }

    return jscExecutor->callFunctionSync(module, method, std::forward<T>(args));
  }

  /**
   * Starts the JS application.  If unbundle is non-null, then it is
   * used to fetch JavaScript modules as individual scripts.
   * Otherwise, the script is assumed to include all the modules.
   */
  void loadApplication(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupCode,
    std::string sourceURL);
  void loadApplicationSync(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupCode,
    std::string sourceURL);

  void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue);
  void* getJavaScriptContext();

  #ifdef WITH_JSC_MEMORY_PRESSURE
  void handleMemoryPressure(int pressureLevel);
  #endif

  /**
   * Synchronously tears down the bridge and the main executor.
   */
  void destroy();
private:
  void runOnExecutorQueue(std::function<void(JSExecutor*)> task);

  // This is used to avoid a race condition where a proxyCallback gets queued
  // after ~NativeToJsBridge(), on the same thread. In that case, the callback
  // will try to run the task on m_callback which will have been destroyed
  // within ~NativeToJsBridge(), thus causing a SIGSEGV.
  std::shared_ptr<bool> m_destroyed;
  std::shared_ptr<JsToNativeBridge> m_delegate;
  std::unique_ptr<JSExecutor> m_executor;
  std::shared_ptr<MessageQueueThread> m_executorMessageQueueThread;

  #ifdef WITH_FBSYSTRACE
  std::atomic_uint_least32_t m_systraceCookie = ATOMIC_VAR_INIT();
  #endif
};

} }
