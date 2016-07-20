// Copyright 2004-present Facebook. All Rights Reserved.

#include "ProxyExecutor.h"

#include <fb/assert.h>
#include <fb/Environment.h>
#include <jni/LocalReference.h>
#include <jni/LocalString.h>
#include <folly/json.h>

#include <react/Bridge.h>
namespace facebook {
namespace react {

const auto EXECUTOR_BASECLASS = "com/facebook/react/bridge/JavaJSExecutor";

static std::string executeJSCallWithProxy(
    jobject executor,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) {
  static auto executeJSCall =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<jstring(jstring, jstring)>("executeJSCall");

  auto result = executeJSCall(
    executor,
    jni::make_jstring(methodName).get(),
    jni::make_jstring(folly::toJson(arguments).c_str()).get());
  return result->toString();
}

std::unique_ptr<JSExecutor> ProxyExecutorOneTimeFactory::createJSExecutor(Bridge *bridge) {
  FBASSERTMSGF(
    m_executor.get() != nullptr,
    "Proxy instance should not be null. Did you attempt to call createJSExecutor() on this factory "
    "instance more than once?");
  return std::unique_ptr<JSExecutor>(new ProxyExecutor(std::move(m_executor), bridge));
}

ProxyExecutor::~ProxyExecutor() {
  m_executor.reset();
}

void ProxyExecutor::loadApplicationScript(
    const std::string&,
    const std::string& sourceURL) {
  static auto loadApplicationScript =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<void(jstring)>("loadApplicationScript");

  // The proxy ignores the script data passed in.

  loadApplicationScript(
    m_executor.get(),
    jni::make_jstring(sourceURL).get());
}

void ProxyExecutor::loadApplicationUnbundle(std::unique_ptr<JSModulesUnbundle>, const std::string&, const std::string&) {
  jni::throwNewJavaException(
    "java/lang/UnsupportedOperationException",
    "Loading application unbundles is not supported for proxy executors");
}

void ProxyExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) {
  std::vector<folly::dynamic> call{
    moduleId,
    methodId,
    std::move(arguments),
  };
  std::string result = executeJSCallWithProxy(m_executor.get(), "callFunctionReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(*this, result, true);
}

void ProxyExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  std::vector<folly::dynamic> call{
    (double) callbackId,
    std::move(arguments)
  };
  std::string result = executeJSCallWithProxy(m_executor.get(), "invokeCallbackAndReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(*this, result, true);
}

void ProxyExecutor::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  static auto setGlobalVariable =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<void(jstring, jstring)>("setGlobalVariable");

  setGlobalVariable(
    m_executor.get(),
    jni::make_jstring(propName).get(),
    jni::make_jstring(jsonValue).get());
}

} }
