/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <optional>

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <react/bridging/Function.h>

#include "NativeArray.h"

namespace facebook::react {

struct JCallback : public jni::JavaClass<JCallback> {
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/Callback;";
};

// Callback from JS into Java TurboModules (resolve, Callback args, event
// emitter). The Kotlin peer routes direct ByteBuffers around folly::dynamic for
// zero-copy jsi::ArrayBuffer on the JS thread.
class JCxxCallbackImpl : public jni::HybridClass<JCxxCallbackImpl, JCallback> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/CxxCallbackImpl;";

  static void registerNatives();

 private:
  friend HybridBase;

  // AsyncCallback<> constructor: Promise resolve / Callback. Callable once.
  explicit JCxxCallbackImpl(AsyncCallback<> callback);

  // std::function constructor: event emitter. Callable multiple times.
  explicit JCxxCallbackImpl(std::function<void(folly::dynamic)> callback);

  void invoke(NativeArray* arguments);
  void invokeWithByteBuffer(
      jni::alias_ref<jni::JByteBuffer::javaobject> buffer);

  std::optional<AsyncCallback<>> asyncCallback_;
  std::function<void(folly::dynamic)> directCallback_;
};

// Promise reject and other error-only callbacks (folly::dynamic only).
class JCxxCallbackRejectImpl
    : public jni::HybridClass<JCxxCallbackRejectImpl, JCallback> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/CxxCallbackRejectImpl;";

  static void registerNatives();

 private:
  friend HybridBase;

  explicit JCxxCallbackRejectImpl(AsyncCallback<> callback);

  void invoke(NativeArray* arguments);

  std::optional<AsyncCallback<>> asyncCallback_;
};

} // namespace facebook::react
