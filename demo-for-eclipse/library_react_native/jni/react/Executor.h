// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>
#include <memory>
#include <jni/Countable.h>

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class JSExecutor;

typedef std::function<void(std::string)> FlushImmediateCallback;

class JSExecutorFactory : public Countable {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(FlushImmediateCallback cb) = 0;
  virtual ~JSExecutorFactory() {};
};

class JSExecutor {
public:
  virtual void executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) = 0;
  virtual std::string executeJSCall(
    const std::string& moduleName,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) = 0;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) = 0;
  virtual bool supportsProfiling() {
    return false;
  };
  virtual void startProfiler(const std::string &titleString) {};
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) {};
  virtual ~JSExecutor() {};
};

} }
