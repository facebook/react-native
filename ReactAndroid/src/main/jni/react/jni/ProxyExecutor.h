// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <react/Executor.h>
#include <fb/fbjni.h>
#include <jni.h>
#include <jni/GlobalReference.h>
#include "OnLoad.h"

namespace facebook {
namespace react {

/**
 * This executor factory can only create a single executor instance because it moves
 * executorInstance global reference to the executor instance it creates.
 */
class ProxyExecutorOneTimeFactory : public CountableJSExecutorFactory {
public:
  ProxyExecutorOneTimeFactory(jni::global_ref<jobject>&& executorInstance) :
    m_executor(std::move(executorInstance)) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) override;

private:
  jni::global_ref<jobject> m_executor;
};

class ProxyExecutor : public JSExecutor {
public:
  ProxyExecutor(jni::global_ref<jobject>&& executorInstance, Bridge *bridge) :
    m_executor(std::move(executorInstance)),
    m_bridge(bridge) {}
  virtual ~ProxyExecutor() override;
  virtual void loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) override;
  virtual void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> bundle,
    const std::string& startupCode,
    const std::string& sourceURL) override;
  virtual void callFunction(
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments) override;
  virtual void invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;

private:
  jni::global_ref<jobject> m_executor;
  Bridge *m_bridge;
};

} }
