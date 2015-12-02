// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <react/Executor.h>
#include <jni/fbjni.h>
#include <jni.h>
#include <jni/GlobalReference.h>

namespace facebook {
namespace react {

/**
 * This executor factory can only create a single executor instance because it moves
 * executorInstance global reference to the executor instance it creates.
 */
class ProxyExecutorOneTimeFactory : public JSExecutorFactory {
public:
  ProxyExecutorOneTimeFactory(jni::global_ref<jobject>&& executorInstance) :
    m_executor(std::move(executorInstance)) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(FlushImmediateCallback ignoredCallback) override;

private:
  jni::global_ref<jobject> m_executor;
};

class ProxyExecutor : public JSExecutor {
public:
  ProxyExecutor(jni::global_ref<jobject>&& executorInstance) :
    m_executor(std::move(executorInstance)) {}
  virtual ~ProxyExecutor() override;
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

private:
  jni::global_ref<jobject> m_executor;
};

} }
