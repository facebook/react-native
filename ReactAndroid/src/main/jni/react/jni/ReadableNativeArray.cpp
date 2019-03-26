// Copyright (c) 2004-present, Facebook, Inc.

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

local_ref<JArrayClass<jobject>> ReadableNativeArray::importArray() {
  jint size = array_.size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint i = 0; i < size; i++) {
    switch(array_.at(i).type()) {
      case folly::dynamic::Type::NULLT: {
        jarray->setElement(i, nullptr);
        break;
      }
      case folly::dynamic::Type::BOOL: {
        (*jarray)[i] = JBoolean::valueOf(ReadableNativeArray::getBoolean(i));
        break;
      }
      case folly::dynamic::Type::INT64:
      case folly::dynamic::Type::DOUBLE: {
        (*jarray)[i] = JDouble::valueOf(ReadableNativeArray::getDouble(i));
        break;
      }
      case folly::dynamic::Type::STRING: {
        (*jarray)[i] = make_jstring(ReadableNativeArray::getString(i));
        break;
      }
      case folly::dynamic::Type::OBJECT: {
        (*jarray)[i] = ReadableNativeArray::getMap(i);
        break;
      }
      case folly::dynamic::Type::ARRAY: {
        (*jarray)[i] = ReadableNativeArray::getArray(i);
        break;
      }
      default:
      break;
    }
  }
  return jarray;
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

local_ref<JArrayClass<jobject>> ReadableNativeArray::importTypeArray() {
  jint size = array_.size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint i = 0; i < size; i++) {
    jarray->setElement(i, ReadableNativeArray::getType(i).release());
  }
  return jarray;
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
    makeNativeMethod("importArray", ReadableNativeArray::importArray),
    makeNativeMethod("importTypeArray", ReadableNativeArray::importTypeArray),
    makeNativeMethod("sizeNative", ReadableNativeArray::getSize),
    makeNativeMethod("isNullNative", ReadableNativeArray::isNull),
    makeNativeMethod("getBooleanNative", ReadableNativeArray::getBoolean),
    makeNativeMethod("getDoubleNative", ReadableNativeArray::getDouble),
    makeNativeMethod("getIntNative", ReadableNativeArray::getInt),
    makeNativeMethod("getStringNative", ReadableNativeArray::getString),
    makeNativeMethod("getArrayNative", ReadableNativeArray::getArray),
    makeNativeMethod("getMapNative", getMapFixed),
    makeNativeMethod("getTypeNative", ReadableNativeArray::getType),
  });
}

} // namespace react
} // namespace facebook
