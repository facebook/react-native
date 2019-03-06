/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fb/fbjni/ByteBuffer.h>

#include <stdexcept>

#include <fb/fbjni/References.h>

namespace facebook {
namespace jni {

namespace {
local_ref<JByteBuffer> createEmpty() {
  static auto cls = JByteBuffer::javaClassStatic();
  static auto meth = cls->getStaticMethod<JByteBuffer::javaobject(int)>("allocateDirect");
  return meth(cls, 0);
}
}

void JBuffer::rewind() const {
  static auto meth = javaClassStatic()->getMethod<alias_ref<JBuffer>()>("rewind");
  meth(self());
}

local_ref<JByteBuffer> JByteBuffer::wrapBytes(uint8_t* data, size_t size) {
  // env->NewDirectByteBuffer requires that size is positive. Android's
  // dalvik returns an invalid result and Android's art aborts if size == 0.
  // Workaround this by using a slow path through Java in that case.
  if (!size) {
    return createEmpty();
  }
  auto res = adopt_local(static_cast<javaobject>(Environment::current()->NewDirectByteBuffer(data, size)));
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  if (!res) {
    throw std::runtime_error("Direct byte buffers are unsupported.");
  }
  return res;
}

uint8_t* JByteBuffer::getDirectBytes() const {
  if (!self()) {
    throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
  }
  void* bytes = Environment::current()->GetDirectBufferAddress(self());
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  if (!bytes) {
    throw std::runtime_error(
        isDirect() ?
          "Attempt to get direct bytes of non-direct byte buffer." :
          "Error getting direct bytes of byte buffer.");
  }
  return static_cast<uint8_t*>(bytes);
}

size_t JByteBuffer::getDirectSize() const {
  if (!self()) {
    throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
  }
  int size = Environment::current()->GetDirectBufferCapacity(self());
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  if (size < 0) {
    throw std::runtime_error(
        isDirect() ?
          "Attempt to get direct size of non-direct byte buffer." :
          "Error getting direct size of byte buffer.");
  }
  return static_cast<size_t>(size);
}

bool JByteBuffer::isDirect() const {
  static auto meth = javaClassStatic()->getMethod<jboolean()>("isDirect");
  return meth(self());
}

}}
