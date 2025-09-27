/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCxxInspectorPackagerConnectionWebSocketDelegate.h"

#include <optional>
#include <utility>

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

JCxxInspectorPackagerConnectionWebSocketDelegate::
    JCxxInspectorPackagerConnectionWebSocketDelegate(
        std::weak_ptr<IWebSocketDelegate> cxxDelegate)
    : cxxDelegate_(std::move(cxxDelegate)) {}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didFailWithError(
    alias_ref<jni::JInteger> posixCode,
    const std::string& error) {
  std::optional<int> posixCodeVal;

  // Handle @Nullable JInteger param
  if (posixCode.get() != nullptr) {
    posixCodeVal = posixCode->intValue();
  }

  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didFailWithError(posixCodeVal, error);
  }
}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didReceiveMessage(
    const std::string& message) {
  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didReceiveMessage(message);
  }
}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didOpen() {
  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didOpen();
  }
}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didClose() {
  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didClose();
  }
}

void JCxxInspectorPackagerConnectionWebSocketDelegate::registerNatives() {
  registerHybrid(
      {makeNativeMethod(
           "didFailWithError",
           JCxxInspectorPackagerConnectionWebSocketDelegate::didFailWithError),
       makeNativeMethod(
           "didReceiveMessage",
           JCxxInspectorPackagerConnectionWebSocketDelegate::didReceiveMessage),
       makeNativeMethod(
           "didClose",
           JCxxInspectorPackagerConnectionWebSocketDelegate::didClose),
       makeNativeMethod(
           "didOpen",
           JCxxInspectorPackagerConnectionWebSocketDelegate::didOpen)});
}

} // namespace facebook::react::jsinspector_modern
