/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCxxInspectorPackagerConnectionWebSocket.h"

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react::jsinspector_modern {

void JCxxInspectorPackagerConnectionWebSocket::send(std::string_view message) {
  static auto method =
      javaClassStatic()->getMethod<void(const std::string&)>("send");
  method(self(), std::string(message));
}

void JCxxInspectorPackagerConnectionWebSocket::close() {
  static auto method = javaClassStatic()->getMethod<void()>("close");
  method(self());
}

JCxxInspectorPackagerConnectionWebSocket::
    ~JCxxInspectorPackagerConnectionWebSocket() {
  close();
}

std::unique_ptr<IWebSocket>
JCxxInspectorPackagerConnectionWebSocket::wrapInUniquePtr() {
  return std::make_unique<RefWrapper>(self());
}

JCxxInspectorPackagerConnectionWebSocket::RefWrapper::RefWrapper(
    alias_ref<javaobject> jWebSocket)
    : jWebSocket_{make_global(jWebSocket)} {}

void JCxxInspectorPackagerConnectionWebSocket::RefWrapper::send(
    std::string_view message) {
  jWebSocket_->send(message);
}

} // namespace facebook::react::jsinspector_modern
