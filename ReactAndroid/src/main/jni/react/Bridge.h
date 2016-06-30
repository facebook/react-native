// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <atomic>
#include <functional>
#include <map>
#include <vector>

#include "ExecutorToken.h"
#include "ExecutorTokenFactory.h"
#include "Executor.h"
#include "MessageQueueThread.h"
#include "MethodCall.h"
#include "JSModulesUnbundle.h"
#include "Value.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class BridgeCallback {
public:
  virtual ~BridgeCallback() {};

  virtual void onCallNativeModules(
      ExecutorToken executorToken,
      const std::string& callJSON,
      bool isEndOfBatch) = 0;

  virtual void onExecutorUnregistered(ExecutorToken executorToken) = 0;
};

class Bridge;
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

class Bridge {
public:
  /**
   * This must be called on the main JS thread.
   */
  Bridge(
      JSExecutorFactory* jsExecutorFactory,
      std::unique_ptr<ExecutorTokenFactory> executorTokenFactory,
      std::unique_ptr<BridgeCallback> callback);
  virtual ~Bridge();

  /**
   * Executes a function with the module ID and method ID and any additional
   * arguments in JS.
   */
  void callFunction(
    ExecutorToken executorToken,
    const std::string& module,
    const std::string& method,
    const folly::dynamic& args,
    const std::string& tracingName);

  /**
   * Invokes a callback with the cbID, and optional additional arguments in JS.
   */
  void invokeCallback(ExecutorToken executorToken, const double callbackId, const folly::dynamic& args);

  /**
   * Starts the JS application from an "bundle", i.e. a JavaScript file that
   * contains code for all modules and a runtime that resolves and
   * executes modules.
   */
  void loadApplicationScript(const std::string& script, const std::string& sourceURL);

  /**
   * Starts the JS application from an "unbundle", i.e. a backend that stores
   * and injects each module as individual file.
   */
  void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL);
  void setGlobalVariable(const std::string& propName, const std::string& jsonValue);
  void* getJavaScriptContext();
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
  void handleMemoryPressureUiHidden();
  void handleMemoryPressureModerate();
  void handleMemoryPressureCritical();

  /**
   * Invokes a set of native module calls on behalf of the given executor.
   *
   * TODO: get rid of isEndOfBatch
   */
  void callNativeModules(JSExecutor& executor, const std::string& callJSON, bool isEndOfBatch);

  /**
   * Returns the ExecutorToken corresponding to the main JSExecutor.
   */
  ExecutorToken getMainExecutorToken() const;

  /**
   * Registers the given JSExecutor which runs on the given MessageQueueThread
   * with the Bridge. Part of this registration is transfering ownership of this
   * JSExecutor to the Bridge for the duration of the registration.
   *
   * Returns a ExecutorToken which can be used to refer to this JSExecutor
   * in the Bridge.
   */
  ExecutorToken registerExecutor(
      std::unique_ptr<JSExecutor> executor,
      std::shared_ptr<MessageQueueThread> executorMessageQueueThread);

  /**
   * Unregisters a JSExecutor that was previously registered with this Bridge
   * using registerExecutor. Use the ExecutorToken returned from this
   * registerExecutor call. This method will return ownership of the unregistered
   * executor to the caller for it to retain or tear down.
   *
   * Returns ownership of the unregistered executor.
   */
  std::unique_ptr<JSExecutor> unregisterExecutor(ExecutorToken executorToken);

  /**
   * Synchronously tears down the bridge and the main executor.
   */
  void destroy();
private:
  void runOnExecutorQueue(ExecutorToken token, std::function<void(JSExecutor*)> task);
  std::unique_ptr<BridgeCallback> m_callback;
  // This is used to avoid a race condition where a proxyCallback gets queued after ~Bridge(),
  // on the same thread. In that case, the callback will try to run the task on m_callback which
  // will have been destroyed within ~Bridge(), thus causing a SIGSEGV.
  std::shared_ptr<std::atomic_bool> m_destroyed;
  JSExecutor* m_mainExecutor;
  std::unique_ptr<ExecutorToken> m_mainExecutorToken;
  std::unique_ptr<ExecutorTokenFactory> m_executorTokenFactory;
  std::unordered_map<JSExecutor*, ExecutorToken> m_executorTokenMap;
  std::unordered_map<ExecutorToken, std::unique_ptr<ExecutorRegistration>> m_executorMap;
  std::mutex m_registrationMutex;
  #ifdef WITH_FBSYSTRACE
  std::atomic_uint_least32_t m_systraceCookie = ATOMIC_VAR_INIT();
  #endif

  MessageQueueThread* getMessageQueueThread(const ExecutorToken& executorToken);
  JSExecutor* getExecutor(const ExecutorToken& executorToken);
  inline ExecutorToken getTokenForExecutor(JSExecutor& executor);
};

} }
