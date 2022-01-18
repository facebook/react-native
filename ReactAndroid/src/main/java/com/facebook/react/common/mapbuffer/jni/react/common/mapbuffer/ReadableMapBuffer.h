/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

  static jni::local_ref<ReadableMapBuffer::jhybridobject> createWithContents(
      MapBuffer &&map);

  explicit ReadableMapBuffer(MapBuffer &&map);

  jni::local_ref<jni::JByteBuffer> importByteBuffer();

 private:
  std::vector<uint8_t> serializedData_;
};

} // namespace react
} // namespace facebook
