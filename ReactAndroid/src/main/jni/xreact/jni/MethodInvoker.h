// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <vector>

#include <fb/fbjni.h>
#include <folly/dynamic.h>

#include <cxxreact/ExecutorToken.h>

#include "ModuleRegistryHolder.h"

namespace facebook {
namespace react {

class Instance;

class MethodInvoker {
public:
  MethodInvoker(jni::alias_ref<JReflectMethod::javaobject> method, std::string signature, std::string traceName, bool isSync);

  MethodCallResult invoke(std::weak_ptr<Instance>& instance, JBaseJavaModule::javaobject module, ExecutorToken token, const folly::dynamic& params);

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
