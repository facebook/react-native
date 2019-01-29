/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fb/fbjni/ReadableByteChannel.h>

namespace facebook {
namespace jni {

int JReadableByteChannel::read(alias_ref<JByteBuffer> dest) const {
  if (!self()) {
    throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
  }
  static auto method = javaClassStatic()->getMethod<jint(alias_ref<JByteBuffer>)>("read");
  return method(self(), dest);
}

}}
