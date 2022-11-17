/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReadableNativeArray.h"

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

// This attribute exports the ctor symbol, so ReadableNativeArray to be
// constructed from other DSOs.
__attribute__((visibility("default")))
ReadableNativeArray::ReadableNativeArray(folly::dynamic array)
    : HybridBase(std::move(array)) {}

// TODO T112842309: Remove after fbjni upgraded in OSS
void ReadableNativeArray::mapException(const std::exception &ex) {
  if (dynamic_cast<const folly::TypeError *>(&ex) != nullptr) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

void ReadableNativeArray::mapException(std::exception_ptr ex) {
  try {
    std::rethrow_exception(ex);
  } catch (const folly::TypeError &err) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, err.what());
  }
}

local_ref<JArrayClass<jobject>> ReadableNativeArray::importArray() {
  jint size = array_.size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    addDynamicToJArray(jarray, ii, array_.at(ii));
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeArray::importTypeArray() {
  jint size = array_.size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    (*jarray)[ii] = ReadableType::getType(array_.at(ii).type());
  }
  return jarray;
}

void ReadableNativeArray::registerNatives() {
  registerHybrid({
      makeNativeMethod("importArray", ReadableNativeArray::importArray),
      makeNativeMethod("importTypeArray", ReadableNativeArray::importTypeArray),
  });
}

} // namespace react
} // namespace facebook
