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
  // TODO T83483191: Using this method is safer than "importByteBuffer" because
  // ByteBuffer memory will be deallocated once the "Java ByteBuffer" is
  // deallocated. Next steps:
  // - Validate perf of this method vs importByteBuffer
  // - Validate that there's no leaking of memory
  react_native_assert(
      (serializedData_ != nullptr && serializedDataSize_ != 0) &&
      "Error serializedData_ is not initialized");
  auto ret = jni::JByteBuffer::allocateDirect(serializedDataSize_);
  // TODO T83483191: avoid allocating serializedData_ when using
  // JByteBuffer::allocateDirect
  std::memcpy(
      ret->getDirectBytes(), (void *)serializedData_, serializedDataSize_);

  // Deallocate serializedData_ since it's not necessary anymore
  delete[] serializedData_;
  serializedData_ = nullptr;
  serializedDataSize_ = 0;
  return ret;
}

jni::JByteBuffer::javaobject ReadableMapBuffer::importByteBuffer() {
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
  return static_cast<jni::JByteBuffer::javaobject>(
      jni::Environment::current()->NewDirectByteBuffer(
          (void *)serializedData_, serializedDataSize_));
}

jni::local_ref<ReadableMapBuffer::jhybridobject>
ReadableMapBuffer::createWithContents(MapBuffer &&map) {
  return newObjectCxxArgs(std::move(map));
}

ReadableMapBuffer::~ReadableMapBuffer() {
  if (serializedData_ != nullptr) {
    delete[] serializedData_;
    serializedData_ = nullptr;
  }
}

} // namespace react
} // namespace facebook
