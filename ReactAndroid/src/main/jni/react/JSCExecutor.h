// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/JSContextRef.h>
#include "Executor.h"
#include "JSCHelpers.h"

namespace facebook {
namespace react {

class JSCExecutorFactory : public JSExecutorFactory {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(FlushImmediateCallback cb) override;
};

class JSCExecutor : public JSExecutor {
public:
  explicit JSCExecutor(FlushImmediateCallback flushImmediateCallback);
  ~JSCExecutor() override;
  virtual void executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) override;
  virtual std::string executeJSCall(
    const std::string& moduleName,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;
  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;
  
  void flushQueueImmediate(std::string queueJSON);
  void installNativeHook(const char *name, JSObjectCallAsFunctionCallback callback);

private:
  JSGlobalContextRef m_context;
  FlushImmediateCallback m_flushImmediateCallback;
};

} }
