/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "fb/fbjni.h"


namespace facebook {
namespace jni {

namespace detail {

void HybridData::setNativePointer(std::unique_ptr<BaseHybridClass> new_value) {
  static auto pointerField = getClass()->getField<jlong>("mNativePointer");
  auto* old_value = reinterpret_cast<BaseHybridClass*>(getFieldValue(pointerField));
  if (new_value) {
    // Modify should only ever be called once with a non-null
    // new_value.  If this happens again it's a programmer error, so
    // blow up.
    FBASSERTMSGF(old_value == 0, "Attempt to set C++ native pointer twice");
  } else if (old_value == 0) {
    return;
  }
  // delete on a null pointer is defined to be a noop.
  delete old_value;
  // This releases ownership from the unique_ptr, and passes the pointer, and
  // ownership of it, to HybridData which is managed by the java GC.  The
  // finalizer on hybridData calls resetNative which will delete the object, if
  // resetNative has not already been called.
  setFieldValue(pointerField, reinterpret_cast<jlong>(new_value.release()));
}

BaseHybridClass* HybridData::getNativePointer() {
  static auto pointerField = getClass()->getField<jlong>("mNativePointer");
  auto* value = reinterpret_cast<BaseHybridClass*>(getFieldValue(pointerField));
  if (!value) {
    throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
  }
  return value;
}

local_ref<HybridData> HybridData::create() {
  return newInstance();
}

}

namespace {
void resetNative(alias_ref<detail::HybridData> jthis) {
  jthis->setNativePointer(nullptr);
}
}

void HybridDataOnLoad() {
  registerNatives("com/facebook/jni/HybridData", {
      makeNativeMethod("resetNative", resetNative),
  });
}

}}
