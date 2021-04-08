/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
      makeNativeMethod(
          "importByteBufferAllocateDirect",
          ReadableMapBuffer::importByteBufferAllocateDirect),
  });
}

jni::local_ref<jni::JByteBuffer>
ReadableMapBuffer::importByteBufferAllocateDirect() {
  // TODO: Using this method is safer than "importByteBuffer" because ByteBuffer
  // memory will be deallocated once the "Java ByteBuffer" is deallocated. Next
  // steps:
  // - Validate perf of this method vs importByteBuffer
  // - Validate that there's no leaking of memory
  return jni::JByteBuffer::allocateDirect(_serializedDataSize);
}

jni::JByteBuffer::javaobject ReadableMapBuffer::importByteBuffer() {
  // TODO: Reevaluate what's the best approach here (allocateDirect vs
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
  return static_cast<jni::JByteBuffer::javaobject>(
      jni::Environment::current()->NewDirectByteBuffer(
          (void *)_serializedData, _serializedDataSize));
}

jni::local_ref<ReadableMapBuffer::jhybridobject>
ReadableMapBuffer::createWithContents(MapBuffer &&map) {
  return newObjectCxxArgs(std::move(map));
}

ReadableMapBuffer::~ReadableMapBuffer() {
  delete[] _serializedData;
  _serializedData = nullptr;
  _serializedDataSize = 0;
}

} // namespace react
} // namespace facebook
