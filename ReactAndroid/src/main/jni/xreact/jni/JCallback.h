// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <fb/fbjni.h>
#include <folly/dynamic.h>

#include "NativeArray.h"

namespace facebook {
namespace react {

class Instance;

struct JCallback : public jni::JavaClass<JCallback> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/Callback;";
};

class JCallbackImpl : public jni::HybridClass<JCallbackImpl, JCallback> {
public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/CallbackImpl;";

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("nativeInvoke", JCallbackImpl::invoke),
    });
  }
private:
  friend HybridBase;

  using Callback = std::function<void(folly::dynamic)>;
  JCallbackImpl(Callback callback) : callback_(std::move(callback)) {}

  void invoke(NativeArray* arguments) {
    callback_(arguments->consume());
  }

  Callback callback_;
};

}
}
