// Copyright 2004-present Facebook. All Rights Reserved.

#include "ProxyExecutor.h"

#include <jni/Environment.h>
#include <jni/LocalReference.h>
#include <jni/LocalString.h>
#include <folly/json.h>

namespace facebook {
namespace react {

const auto EXECUTOR_BASECLASS = "com/facebook/react/bridge/ProxyJavaScriptExecutor$JavaJSExecutor";

std::unique_ptr<JSExecutor> ProxyExecutorOneTimeFactory::createJSExecutor(FlushImmediateCallback ignoredCallback) {
  FBASSERTMSGF(
    m_executor.get() != nullptr,
    "Proxy instance should not be null. Did you attempt to call createJSExecutor() on this factory "
    "instance more than once?");
  return std::unique_ptr<JSExecutor>(new ProxyExecutor(std::move(m_executor)));
}

ProxyExecutor::~ProxyExecutor() {
  m_executor.reset();
}

void ProxyExecutor::executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) {
  static auto executeApplicationScript =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<void(jstring, jstring)>("executeApplicationScript");

  executeApplicationScript(
    m_executor.get(),
    jni::make_jstring(script).get(),
    jni::make_jstring(sourceURL).get());
}

std::string ProxyExecutor::executeJSCall(
    const std::string& moduleName,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) {
  static auto executeJSCall =
    jni::findClassStatic(EXECUTOR_BASECLASS)->getMethod<jstring(jstring, jstring, jstring)>("executeJSCall");

  auto result = executeJSCall(
    m_executor.get(),
    jni::make_jstring(moduleName).get(),
    jni::make_jstring(methodName).get(),
    jni::make_jstring(folly::toJson(arguments).c_str()).get());
  return result->toString();
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
