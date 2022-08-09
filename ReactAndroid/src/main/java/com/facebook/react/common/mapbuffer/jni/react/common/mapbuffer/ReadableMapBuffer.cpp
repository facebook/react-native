/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReadableMapBuffer.h"

namespace facebook {
namespace react {

void ReadableMapBuffer::registerNatives() {
  registerHybrid({
      makeNativeMethod("importByteBuffer", ReadableMapBuffer::importByteBuffer),
  });
}

jni::local_ref<jni::JByteBuffer> ReadableMapBuffer::importByteBuffer() {
  // TODO T83483191: Reevaluate what's the best approach here (allocateDirect vs
  // DirectByteBuffer).
  //
  // On this method we should:
  // - Review deallocation of serializedData (we are probably leaking
  // _serializedData now).
  // - Consider using allocate() or allocateDirect() methods from java instead
  // of newDirectByteBuffer (to simplify de/allocation) :
  // https://www.internalfb.com/intern/diffusion/FBS/browsefile/master/fbandroid/libraries/fbjni/cxx/fbjni/ByteBuffer.cpp
  // - Add flags to describe if the data was already 'imported'
  // - Long-term: Consider creating a big ByteBuffer that can be re-used to
  // transfer data of multitple Maps
  return jni::JByteBuffer::wrapBytes(
      serializedData_.data(), serializedData_.size());
}

jni::local_ref<ReadableMapBuffer::jhybridobject>
ReadableMapBuffer::createWithContents(MapBuffer &&map) {
  return newObjectCxxArgs(std::move(map));
}

ReadableMapBuffer::ReadableMapBuffer(MapBuffer &&map)
    : serializedData_(std::move(map.bytes_)) {
  react_native_assert(
      (serializedData_.size() != 0) && "Error no content in map");
}

} // namespace react
} // namespace facebook
