// Copyright 2004-present Facebook. All Rights Reserved.

#include "ProxyExecutor.h"

#include <cxxreact/JSBigString.h>
#include <cxxreact/ModuleRegistry.h>
#include <cxxreact/SystraceSection.h>
#include <fb/assert.h>
#include <fb/Environment.h>
#include <folly/json.h>
#include <folly/Memory.h>
#include <jni/LocalReference.h>
#include <jni/LocalString.h>

namespace facebook {
namespace react {

const auto EXECUTOR_BASECLASS = "com/facebook/react/bridge/JavaJSExecutor";

static std::string executeJSCallWithProxy(
    jobject executor,
    const std::string& methodName,
    const folly::dynamic& arguments) {
  static auto executeJSCall =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<jstring(jstring, jstring)>("executeJSCall");

  auto result = executeJSCall(
    executor,
    jni::make_jstring(methodName).get(),
    jni::make_jstring(folly::toJson(arguments).c_str()).get());
  return result->toString();
}

std::unique_ptr<JSExecutor> ProxyExecutorOneTimeFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate, std::shared_ptr<MessageQueueThread>) {
  return folly::make_unique<ProxyExecutor>(std::move(m_executor), delegate);
}

ProxyExecutor::ProxyExecutor(jni::global_ref<jobject>&& executorInstance,
                             std::shared_ptr<ExecutorDelegate> delegate)
    : m_executor(std::move(executorInstance))
    , m_delegate(delegate)
{}

ProxyExecutor::~ProxyExecutor() {
  m_executor.reset();
}

void ProxyExecutor::loadApplicationScript(
    std::unique_ptr<const JSBigString>,
    std::string sourceURL) {

  folly::dynamic nativeModuleConfig = folly::dynamic::array;

  {
    SystraceSection s("collectNativeModuleDescriptions");
    auto moduleRegistry = m_delegate->getModuleRegistry();
    for (const auto& name : moduleRegistry->moduleNames()) {
      auto config = moduleRegistry->getConfig(name);
      nativeModuleConfig.push_back(config ? config->config : nullptr);
    }
  }

  folly::dynamic config =
    folly::dynamic::object
    ("remoteModuleConfig", std::move(nativeModuleConfig));

  {
    SystraceSection t("setGlobalVariable");
    setGlobalVariable(
      "__fbBatchedBridgeConfig",
      folly::make_unique<JSBigStdString>(folly::toJson(config)));
  }

  static auto loadApplicationScript =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<void(jstring)>("loadApplicationScript");

  // The proxy ignores the script data passed in.

  loadApplicationScript(
    m_executor.get(),
    jni::make_jstring(sourceURL).get());
  // We can get pending calls here to native but the queue will be drained when
  // we launch the application.
}

void ProxyExecutor::setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle>) {
  jni::throwNewJavaException(
    "java/lang/UnsupportedOperationException",
    "Loading application unbundles is not supported for proxy executors");
}

void ProxyExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) {
  auto call = folly::dynamic::array(moduleId, methodId, std::move(arguments));

  std::string result = executeJSCallWithProxy(m_executor.get(), "callFunctionReturnFlushedQueue", std::move(call));
  m_delegate->callNativeModules(*this, folly::parseJson(result), true);
}

void ProxyExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  auto call = folly::dynamic::array(callbackId, std::move(arguments));
  std::string result = executeJSCallWithProxy(m_executor.get(), "invokeCallbackAndReturnFlushedQueue", std::move(call));
  m_delegate->callNativeModules(*this, folly::parseJson(result), true);
}

void ProxyExecutor::setGlobalVariable(std::string propName,
                                      std::unique_ptr<const JSBigString> jsonValue) {
  static auto setGlobalVariable =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<void(jstring, jstring)>("setGlobalVariable");

  setGlobalVariable(
    m_executor.get(),
    jni::make_jstring(propName).get(),
    jni::make_jstring(jsonValue->c_str()).get());
}

} }
