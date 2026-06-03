/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCallback.h"

#include <vector>

#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

#include "JMutableDataBuffer.h"
#include "TurboModuleJSError.h"

namespace facebook::react {

namespace {

jsi::Value byteBufferToJSIArrayBuffer(
    jsi::Runtime& rt,
    jni::global_ref<jni::JByteBuffer> buffer) {
  auto mutableBuf = std::make_shared<JMutableDataBuffer>(std::move(buffer));
  return jsi::Value(rt, jsi::ArrayBuffer(rt, std::move(mutableBuf)));
}

} // namespace

void JCxxCallbackImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("nativeInvoke", JCxxCallbackImpl::invoke),
      makeNativeMethod(
          "nativeInvokeWithByteBuffer",
          JCxxCallbackImpl::invokeWithByteBuffer),
  });
}

JCxxCallbackImpl::JCxxCallbackImpl(AsyncCallback<> callback)
    : asyncCallback_(std::move(callback)) {}

JCxxCallbackImpl::JCxxCallbackImpl(std::function<void(folly::dynamic)> callback)
    : directCallback_(std::move(callback)) {}

void JCxxCallbackImpl::invoke(NativeArray* arguments) {
  auto args = arguments->consume();
  if (directCallback_) {
    directCallback_(std::move(args));
    return;
  }
  if (!asyncCallback_) {
    LOG(FATAL) << "CxxCallbackImpl::invoke called more than once";
    return;
  }
  asyncCallback_->call(
      [args = std::move(args)](jsi::Runtime& rt, jsi::Function& fn) {
        std::vector<jsi::Value> jsArgs;
        jsArgs.reserve(args.size());
        for (const auto& val : args) {
          jsArgs.emplace_back(jsi::valueFromDynamic(rt, val));
        }
        fn.call(rt, (const jsi::Value*)jsArgs.data(), jsArgs.size());
      });
  asyncCallback_ = std::nullopt;
}

void JCxxCallbackImpl::invokeWithByteBuffer(
    jni::alias_ref<jni::JByteBuffer::javaobject> buffer) {
  if (directCallback_) {
    LOG(FATAL) << "ByteBuffer arguments are not supported for this callback";
    return;
  }
  if (!asyncCallback_) {
    LOG(FATAL) << "CxxCallbackImpl::invokeWithByteBuffer called more than once";
    return;
  }
  asyncCallback_->call([buffer = jni::make_global(buffer)](
                          jsi::Runtime& rt, jsi::Function& fn) mutable {
    fn.call(rt, byteBufferToJSIArrayBuffer(rt, std::move(buffer)));
  });
  asyncCallback_ = std::nullopt;
}

void JCxxCallbackRejectImpl::registerNatives() {
  registerHybrid(
      {makeNativeMethod("nativeInvoke", JCxxCallbackRejectImpl::invoke)});
}

JCxxCallbackRejectImpl::JCxxCallbackRejectImpl(AsyncCallback<> callback)
    : asyncCallback_(std::move(callback)) {}

void JCxxCallbackRejectImpl::invoke(NativeArray* arguments) {
  auto args = arguments->consume();
  if (!asyncCallback_) {
    LOG(FATAL) << "CxxCallbackRejectImpl::invoke called more than once";
    return;
  }
  asyncCallback_->call([args = std::move(args)](
                          jsi::Runtime& rt, jsi::Function& fn) {
    fn.call(rt, createRejectionError(rt, args));
  });
  asyncCallback_ = std::nullopt;
}

} // namespace facebook::react
