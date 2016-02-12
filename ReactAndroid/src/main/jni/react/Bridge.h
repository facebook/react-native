// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <map>
#include <vector>

#include "Executor.h"
#include "MethodCall.h"
#include "JSModulesUnbundle.h"
#include "Value.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class Bridge {
public:
  typedef std::function<void(std::vector<MethodCall>, bool isEndOfBatch)> Callback;

  Bridge(JSExecutorFactory* jsExecutorFactory, Callback callback);
  virtual ~Bridge();

  /**
   * Executes a function with the module ID and method ID and any additional
   * arguments in JS.
   */
  void callFunction(const double moduleId, const double methodId, const folly::dynamic& args);

  /**
   * Invokes a callback with the cbID, and optional additional arguments in JS.
   */
  void invokeCallback(const double callbackId, const folly::dynamic& args);

  /**
   * Starts the JS application from an "bundle", i.e. a JavaScript file that
   * contains code for all modules and a runtime that resolves and
   * executes modules.
   */
  void executeApplicationScript(const std::string& script, const std::string& sourceURL);
  /**
   * Starts the JS application from an "unbundle", i.e. a backend that stores
   * and injects each module as individual file.
   */
  void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL);
  void setGlobalVariable(const std::string& propName, const std::string& jsonValue);
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
  void handleMemoryPressureModerate();
  void handleMemoryPressureCritical();

  /**
   * TODO: get rid of isEndOfBatch
   */
  void callNativeModules(const std::string& callJSON, bool isEndOfBatch);
private:
  Callback m_callback;
  // This is used to avoid a race condition where a proxyCallback gets queued after ~Bridge(),
  // on the same thread. In that case, the callback will try to run the task on m_callback which
  // will have been destroyed within ~Bridge(), thus causing a SIGSEGV.
  std::shared_ptr<bool> m_destroyed;
  std::unique_ptr<JSExecutor> m_jsExecutor;
};

} }
