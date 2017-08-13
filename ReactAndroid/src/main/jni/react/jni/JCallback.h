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

class JCxxCallbackImpl : public jni::HybridClass<JCxxCallbackImpl, JCallback> {
public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/CxxCallbackImpl;";

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("nativeInvoke", JCxxCallbackImpl::invoke),
    });
  }
private:
  friend HybridBase;

  using Callback = std::function<void(folly::dynamic)>;
  JCxxCallbackImpl(Callback callback) : callback_(std::move(callback)) {}

  void invoke(NativeArray* arguments) {
    callback_(arguments->consume());
  }

  Callback callback_;
};

}
}
