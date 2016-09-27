// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <atomic>
#include <functional>
#include <map>
#include <vector>

#include <folly/dynamic.h>

#include "Executor.h"
#include "ExecutorToken.h"
#include "JSModulesUnbundle.h"
#include "MessageQueueThread.h"
#include "MethodCall.h"
#include "NativeModule.h"
#include "Value.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

struct InstanceCallback;
class ModuleRegistry;

class ExecutorRegistration {
public:
  ExecutorRegistration(
      std::unique_ptr<JSExecutor> executor,
      std::shared_ptr<MessageQueueThread> executorMessageQueueThread) :
    executor_(std::move(executor)),
    messageQueueThread_(executorMessageQueueThread) {}

  std::unique_ptr<JSExecutor> executor_;
  std::shared_ptr<MessageQueueThread> messageQueueThread_;
};

class JsToNativeBridge;

// This class manages calls from native code to JS.  It also manages
// executors and their threads.  This part is used by both bridges for
// now, but further refactorings should separate the bridges more
// fully #11247981.
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
      std::unique_ptr<MessageQueueThread> nativeQueue,
      std::shared_ptr<InstanceCallback> callback);
  virtual ~NativeToJsBridge();

  /**
   * Executes a function with the module ID and method ID and any additional
   * arguments in JS.
   */
  void callFunction(
    ExecutorToken executorToken,
    std::string&& module,
    std::string&& method,
    folly::dynamic&& args);

  /**
   * Invokes a callback with the cbID, and optional additional arguments in JS.
   */
  void invokeCallback(ExecutorToken executorToken, double callbackId, folly::dynamic&& args);

  /**
   * Starts the JS application from an "bundle", i.e. a JavaScript file that
   * contains code for all modules and a runtime that resolves and
   * executes modules.
   */
  void loadApplicationScript(std::unique_ptr<const JSBigString> script, std::string sourceURL);

  /**
   * Similar to loading a "bundle", but instead of passing js source this method accepts
   * path to a directory containing files prepared for particular JSExecutor.
   */
  void loadOptimizedApplicationScript(std::string bundlePath, std::string sourceURL, int flags);

  /**
   * An "unbundle" is a backend that stores and injects JavaScript modules as
   * individual scripts, rather than bundling all of them into a single scrupt.
   *
   * Loading an unbundle means setting the storage backend and executing the
   * startup script.
   */
  void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupCode,
    std::string sourceURL);
  void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue);
  void* getJavaScriptContext();
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
  void handleMemoryPressureUiHidden();
  void handleMemoryPressureModerate();
  void handleMemoryPressureCritical();

  /**
   * Returns the ExecutorToken corresponding to the main JSExecutor.
   */
  ExecutorToken getMainExecutorToken() const;

  /**
   * Synchronously tears down the bridge and the main executor.
   */
  void destroy();
private:
  /**
   * Registers the given JSExecutor which runs on the given MessageQueueThread
   * with the NativeToJsBridge. Part of this registration is transfering
   * ownership of this JSExecutor to the NativeToJsBridge for the duration of
   * the registration.
   *
   * Returns a ExecutorToken which can be used to refer to this JSExecutor
   * in the NativeToJsBridge.
   */
  ExecutorToken registerExecutor(
      ExecutorToken token,
      std::unique_ptr<JSExecutor> executor,
      std::shared_ptr<MessageQueueThread> executorMessageQueueThread);

  /**
   * Unregisters a JSExecutor that was previously registered with this NativeToJsBridge
   * using registerExecutor.
   */
  std::unique_ptr<JSExecutor> unregisterExecutor(JSExecutor& executorToken);

  void runOnExecutorQueue(ExecutorToken token, std::function<void(JSExecutor*)> task);

  // This is used to avoid a race condition where a proxyCallback gets queued
  // after ~NativeToJsBridge(), on the same thread. In that case, the callback
  // will try to run the task on m_callback which will have been destroyed
  // within ~NativeToJsBridge(), thus causing a SIGSEGV.
  std::shared_ptr<bool> m_destroyed;
  JSExecutor* m_mainExecutor;
  ExecutorToken m_mainExecutorToken;
  std::shared_ptr<JsToNativeBridge> m_delegate;
  std::unordered_map<JSExecutor*, ExecutorToken> m_executorTokenMap;
  std::unordered_map<ExecutorToken, ExecutorRegistration> m_executorMap;
  std::mutex m_registrationMutex;
  #ifdef WITH_FBSYSTRACE
  std::atomic_uint_least32_t m_systraceCookie = ATOMIC_VAR_INIT();
  #endif

  MessageQueueThread* getMessageQueueThread(const ExecutorToken& executorToken);
  JSExecutor* getExecutor(const ExecutorToken& executorToken);
  ExecutorToken getTokenForExecutor(JSExecutor& executor);
};

} }
