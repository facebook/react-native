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
  virtual void loadApplicationUnbundle(
    JSModulesUnbundle&& bundle,
    const std::string& startupCode,
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

private:
  jni::global_ref<jobject> m_executor;
};

} }
