/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReadableMapBuffer.h"

namespace facebook::react {

jni::local_ref<jni::JByteBuffer> JReadableMapBuffer::importByteBuffer() {
  // TODO T83483191: Reevaluate what's the best approach here (allocateDirect vs
  // DirectByteBuffer).
  return jni::JByteBuffer::wrapBytes(
      serializedData_.data(), serializedData_.size());
}

std::vector<uint8_t> JReadableMapBuffer::data() const {
  return serializedData_;
}

jni::local_ref<JReadableMapBuffer::jhybridobject>
JReadableMapBuffer::createWithContents(MapBuffer&& map) {
  auto cxxPart = std::make_unique<JReadableMapBuffer>(std::move(map));
  auto javaPart = newObjectJavaArgs(cxxPart->importByteBuffer(), 0);
  setNativePointer(javaPart, std::move(cxxPart));
  return javaPart;
}

JReadableMapBuffer::JReadableMapBuffer(MapBuffer&& map)
    : serializedData_(std::move(map.bytes_)) {
  react_native_assert(
      (serializedData_.size() != 0) && "Error no content in map");
}

} // namespace facebook::react
