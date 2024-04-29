/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCxxInspectorPackagerConnectionWebSocketDelegate.h"

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

JCxxInspectorPackagerConnectionWebSocketDelegate::
    JCxxInspectorPackagerConnectionWebSocketDelegate(
        std::weak_ptr<IWebSocketDelegate> cxxDelegate)
    : cxxDelegate_(cxxDelegate) {}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didFailWithError(
    alias_ref<JOptionalInt::javaobject> posixCode,
    const std::string& error) {
  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didFailWithError(*posixCode, error);
  }
}

void JCxxInspectorPackagerConnectionWebSocketDelegate::didReceiveMessage(
    const std::string& message) {
  if (auto delegate = cxxDelegate_.lock()) {
    delegate->didReceiveMessage(message);
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
           JCxxInspectorPackagerConnectionWebSocketDelegate::didClose)});
}

} // namespace facebook::react::jsinspector_modern
