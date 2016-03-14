// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>
#include <memory>

#include "JSModulesUnbundle.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class Bridge;
class JSExecutor;
class JSExecutorFactory {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) = 0;
  virtual ~JSExecutorFactory() {};
};

class JSExecutor {
public:
  /**
   * Execute an application script bundle in the JS context.
   */
  virtual void loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) = 0;

  /**
   * Add an application "unbundle" file
   */
  virtual void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> bundle,
    const std::string& startupCode,
    const std::string& sourceURL) = 0;

  /**
   * Executes BatchedBridge.callFunctionReturnFlushedQueue with the module ID,
   * method ID and optional additional arguments in JS. The executor is responsible
   * for using Bridge->callNativeModules to invoke any necessary native modules methods.
   */
  virtual void callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) = 0;

  /**
   * Executes BatchedBridge.invokeCallbackAndReturnFlushedQueue with the cbID,
   * and optional additional arguments in JS and returns the next queue. The executor
   * is responsible for using Bridge->callNativeModules to invoke any necessary
   * native modules methods.
   */
  virtual void invokeCallback(const double callbackId, const folly::dynamic& arguments) = 0;

  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) = 0;
  virtual void* getJavaScriptContext() {
    return nullptr;
  };
  virtual bool supportsProfiling() {
    return false;
  };
  virtual void startProfiler(const std::string &titleString) {};
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) {};
  virtual void handleMemoryPressureModerate() {};
  virtual void handleMemoryPressureCritical() {
    handleMemoryPressureModerate();
  };
  virtual void destroy() {};
  virtual ~JSExecutor() {};
};

} }
