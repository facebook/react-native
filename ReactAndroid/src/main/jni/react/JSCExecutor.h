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
  virtual std::string flush() override;
  virtual std::string callFunction(
    const double moduleId,
    const double methodId,
    const folly::dynamic& arguments) override;
  virtual std::string invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;
  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;
  virtual void handleMemoryPressureModerate() override;
  virtual void handleMemoryPressureCritical() override;

  void flushQueueImmediate(std::string queueJSON);
  void installNativeHook(const char *name, JSObjectCallAsFunctionCallback callback);

private:
  JSGlobalContextRef m_context;
  FlushImmediateCallback m_flushImmediateCallback;
};

} }
