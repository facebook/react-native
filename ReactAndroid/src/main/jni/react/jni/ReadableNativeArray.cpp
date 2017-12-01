// Copyright 2004-present Facebook. All Rights Reserved.

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

jint ReadableNativeArray::getSize() {
  return array_.size();
}

jboolean ReadableNativeArray::isNull(jint index) {
  return array_.at(index).isNull() ? JNI_TRUE : JNI_FALSE;
}

jboolean ReadableNativeArray::getBoolean(jint index) {
  return array_.at(index).getBool() ? JNI_TRUE : JNI_FALSE;
}

jdouble ReadableNativeArray::getDouble(jint index) {
  const folly::dynamic& val = array_.at(index);
  if (val.isInt()) {
    return val.getInt();
  }
  return val.getDouble();
}

jint ReadableNativeArray::getInt(jint index) {
  const folly::dynamic& val = array_.at(index);
  int64_t integer = convertDynamicIfIntegral(val);
  return makeJIntOrThrow(integer);
}

const char* ReadableNativeArray::getString(jint index) {
  const folly::dynamic& dyn = array_.at(index);
  if (dyn.isNull()) {
    return nullptr;
  }
  return dyn.getString().c_str();
}

local_ref<ReadableNativeArray::jhybridobject> ReadableNativeArray::getArray(jint index) {
  auto& elem = array_.at(index);
  if (elem.isNull()) {
    return local_ref<ReadableNativeArray::jhybridobject>(nullptr);
  } else {
    return ReadableNativeArray::newObjectCxxArgs(elem);
  }
}

local_ref<ReadableType> ReadableNativeArray::getType(jint index) {
  return ReadableType::getType(array_.at(index).type());
}

local_ref<NativeMap::jhybridobject> ReadableNativeArray::getMap(jint index) {
  auto& elem = array_.at(index);
  return ReadableNativeMap::createWithContents(folly::dynamic(elem));
}

namespace {
// This is just to allow signature deduction below.
local_ref<ReadableNativeMap::jhybridobject> getMapFixed(alias_ref<ReadableNativeArray::jhybridobject> array, jint index) {
  return static_ref_cast<ReadableNativeMap::jhybridobject>(array->cthis()->getMap(index));
}
}

void ReadableNativeArray::registerNatives() {
  registerHybrid({
    makeNativeMethod("size", ReadableNativeArray::getSize),
    makeNativeMethod("isNull", ReadableNativeArray::isNull),
    makeNativeMethod("getBoolean", ReadableNativeArray::getBoolean),
    makeNativeMethod("getDouble", ReadableNativeArray::getDouble),
    makeNativeMethod("getInt", ReadableNativeArray::getInt),
    makeNativeMethod("getString", ReadableNativeArray::getString),
    makeNativeMethod("getArray", ReadableNativeArray::getArray),
    makeNativeMethod("getMap", getMapFixed),
    makeNativeMethod("getType", ReadableNativeArray::getType),
  });
}

} // namespace react
} // namespace facebook
