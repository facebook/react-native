// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <vector>

#include <cxxreact/ExecutorToken.h>
#include <fb/fbjni.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

class Instance;

struct JReflectMethod : public jni::JavaClass<JReflectMethod> {
  static constexpr auto kJavaDescriptor = "Ljava/lang/reflect/Method;";

  jmethodID getMethodID() {
    auto id = jni::Environment::current()->FromReflectedMethod(self());
    jni::throwPendingJniExceptionAsCppException();
    return id;
  }
};

struct JBaseJavaModule : public jni::JavaClass<JBaseJavaModule> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/BaseJavaModule;";
};

class MethodInvoker {
public:
  MethodInvoker(jni::alias_ref<JReflectMethod::javaobject> method, std::string signature, std::string traceName, bool isSync);

  MethodCallResult invoke(std::weak_ptr<Instance>& instance, jni::alias_ref<JBaseJavaModule::javaobject> module, ExecutorToken token, const folly::dynamic& params);

  bool isSyncHook() const {
    return isSync_;
  }
private:
  jmethodID method_;
  std::size_t jsArgCount_;
  std::string signature_;
  std::string traceName_;
  bool isSync_;
};

}
}
