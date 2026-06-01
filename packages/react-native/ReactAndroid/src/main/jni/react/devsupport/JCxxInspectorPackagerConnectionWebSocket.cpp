/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/ByteBuffer.h>

#include "JCxxInspectorPackagerConnectionWebSocket.h"

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react::jsinspector_modern {

namespace {

local_ref<JByteBuffer::javaobject> getReadOnlyByteBufferFromStringView(
    std::string_view sv) {
  auto buffer = JByteBuffer::wrapBytes(
      const_cast<uint8_t*>(reinterpret_cast<const uint8_t*>(sv.data())),
      sv.size());

  /**
   * Return a read-only buffer that shares the underlying contents.
   * This guards from accidential mutations on the Java side, since we did
   * casting above.
   *
   * https://docs.oracle.com/javase/8/docs/api/java/nio/ByteBuffer.html#asReadOnlyBuffer--
   */
  static auto method =
      buffer->javaClassStatic()->getMethod<JByteBuffer::javaobject()>(
          "asReadOnlyBuffer");
  return method(buffer);
}

} // namespace

void JCxxInspectorPackagerConnectionWebSocket::send(std::string_view message) {
  static auto method =
      javaClassStatic()->getMethod<void(local_ref<JByteBuffer::javaobject>)>(
          "send");
  auto byteBuffer = getReadOnlyByteBufferFromStringView(message);
  method(self(), byteBuffer);
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
