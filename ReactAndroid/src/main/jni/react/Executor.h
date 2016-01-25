// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>
#include <memory>
#include <jni/Countable.h>
#include "JSModulesUnbundle.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class JSExecutor;

typedef std::function<void(std::string, bool)> FlushImmediateCallback;

class JSExecutorFactory : public Countable {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(FlushImmediateCallback cb) = 0;
  virtual ~JSExecutorFactory() {};
};

class JSExecutor {
public:
  /**
   * Execute an application script bundle in the JS context.
   */
  virtual void executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) = 0;

  /**
   * Add an application "unbundle" file
   */
  virtual void loadApplicationUnbundle(
    JSModulesUnbundle&& bundle,
    const std::string& startupCode,
    const std::string& sourceURL) = 0;

  /**
   * Executes BatchedBridge.flushedQueue in JS to get the next queue of changes.
   */
  virtual std::string flush() = 0;

  /**
   * Executes BatchedBridge.callFunctionReturnFlushedQueue with the module ID,
   * method ID and optional additional arguments in JS, and returns the next
   * queue.
   */
  virtual std::string callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) = 0;

  /**
   * Executes BatchedBridge.invokeCallbackAndReturnFlushedQueue with the cbID,
   * and optional additional arguments in JS and returns the next queue.
   */
  virtual std::string invokeCallback(const double callbackId, const folly::dynamic& arguments) = 0;

  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) = 0;
  virtual bool supportsProfiling() {
    return false;
  };
  virtual void startProfiler(const std::string &titleString) {};
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) {};
  virtual void handleMemoryPressureModerate() {};
  virtual void handleMemoryPressureCritical() {
    handleMemoryPressureModerate();
  };
  virtual ~JSExecutor() {};
};

} }
