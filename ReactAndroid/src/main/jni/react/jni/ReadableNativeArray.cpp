// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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

void ReadableNativeArray::mapException(const std::exception& ex) {
  if (dynamic_cast<const folly::TypeError*>(&ex) != nullptr) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

local_ref<JArrayClass<jobject>> ReadableNativeArray::importArray() {
  jint size = array_.size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    const auto &element = array_.at(ii);
    switch(element.type()) {
      case folly::dynamic::Type::NULLT: {
        jarray->setElement(ii, nullptr);
        break;
      }
      case folly::dynamic::Type::BOOL: {
        (*jarray)[ii] = JBoolean::valueOf(element.getBool());
        break;
      }
      case folly::dynamic::Type::INT64: {
        (*jarray)[ii] = JDouble::valueOf(element.getInt());
        break;
      }
      case folly::dynamic::Type::DOUBLE: {
        (*jarray)[ii] = JDouble::valueOf(element.getDouble());
        break;
      }
      case folly::dynamic::Type::STRING: {
        (*jarray)[ii] = make_jstring(element.getString());
        break;
      }
      case folly::dynamic::Type::OBJECT: {
        (*jarray)[ii] =  ReadableNativeMap::newObjectCxxArgs(element);
        break;
      }
      case folly::dynamic::Type::ARRAY: {
        (*jarray)[ii] = ReadableNativeArray::newObjectCxxArgs(element);
        break;
      }
      default:
        break;
    }
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
