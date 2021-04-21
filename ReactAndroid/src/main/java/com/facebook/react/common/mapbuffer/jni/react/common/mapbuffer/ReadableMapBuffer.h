/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

#include <fbjni/ByteBuffer.h>

namespace facebook {
namespace react {

class ReadableMapBuffer : public jni::HybridClass<ReadableMapBuffer> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/common/mapbuffer/ReadableMapBuffer;";

  static void registerNatives();

  static jni::local_ref<jhybridobject> createWithContents(MapBuffer &&map);

  jni::local_ref<jni::JByteBuffer> importByteBufferAllocateDirect();

  jni::JByteBuffer::javaobject importByteBuffer();

  ~ReadableMapBuffer();

 private:
  uint8_t *_serializedData = nullptr;

  int _serializedDataSize = 0;

  friend HybridBase;

  explicit ReadableMapBuffer(MapBuffer &&map) {
    _serializedDataSize = map.getBufferSize();
    react_native_assert(
        (_serializedDataSize != 0) && "Error no content in map");
    _serializedData = new Byte[_serializedDataSize];
    map.copy(_serializedData);
  }
};

} // namespace react
} // namespace facebook
