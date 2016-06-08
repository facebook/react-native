// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <fb/fbjni.h>

#include <react/jni/NativeArray.h>

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
    callback_(std::move(arguments->array));
  }

  Callback callback_;
};

}
}
