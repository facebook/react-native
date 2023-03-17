/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

// TODO T112842309: Remove after fbjni upgraded in OSS
void ReadableNativeMap::mapException(const std::exception &ex) {
  if (dynamic_cast<const folly::TypeError *>(&ex) != nullptr) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

void ReadableNativeMap::mapException(std::exception_ptr ex) {
  try {
    std::rethrow_exception(ex);
  } catch (const folly::TypeError &err) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, err.what());
  }
}

void addDynamicToJArray(
    local_ref<JArrayClass<jobject>> jarray,
    jint index,
    const folly::dynamic &dyn) {
  switch (dyn.type()) {
    case folly::dynamic::Type::NULLT: {
      jarray->setElement(index, nullptr);
      break;
    }
    case folly::dynamic::Type::BOOL: {
      (*jarray)[index] = JBoolean::valueOf(dyn.getBool());
      break;
    }
    case folly::dynamic::Type::INT64: {
      (*jarray)[index] = JDouble::valueOf(dyn.getInt());
      break;
    }
    case folly::dynamic::Type::DOUBLE: {
      (*jarray)[index] = JDouble::valueOf(dyn.getDouble());
      break;
    }
    case folly::dynamic::Type::STRING: {
      (*jarray)[index] = make_jstring(dyn.getString());
      break;
    }
    case folly::dynamic::Type::OBJECT: {
      (*jarray)[index] = ReadableNativeMap::newObjectCxxArgs(dyn);
      break;
    }
    case folly::dynamic::Type::ARRAY: {
      (*jarray)[index] = ReadableNativeArray::newObjectCxxArgs(dyn);
      break;
    }
    default:
      jarray->setElement(index, nullptr);
      break;
  }
}

local_ref<JArrayClass<jstring>> ReadableNativeMap::importKeys() {
  throwIfConsumed();

  keys_ = folly::dynamic::array();
  if (map_ == nullptr) {
    return JArrayClass<jstring>::newArray(0);
  }
  auto jarray = JArrayClass<jstring>::newArray(map_.size());
  jint i = 0;
  for (auto &pair : map_.items()) {
    auto value = pair.first.asString();
    (*keys_).push_back(value);
    (*jarray)[i++] = make_jstring(value);
  }

  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importValues() {
  throwIfConsumed();

  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    const std::string &key = (*keys_)[ii].getString();
    addDynamicToJArray(jarray, ii, map_.at(key));
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importTypes() {
  throwIfConsumed();

  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    const std::string &key = (*keys_)[ii].getString();
    (*jarray)[ii] = ReadableType::getType(map_.at(key).type());
  }
  return jarray;
}

local_ref<ReadableNativeMap::jhybridobject>
ReadableNativeMap::createWithContents(folly::dynamic &&map) {
  if (map.isNull()) {
    return local_ref<jhybridobject>(nullptr);
  }

  if (!map.isObject()) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass,
        "expected Map, got a %s",
        map.typeName());
  }

  return newObjectCxxArgs(std::move(map));
}

void ReadableNativeMap::registerNatives() {
  registerHybrid({
      makeNativeMethod("importKeys", ReadableNativeMap::importKeys),
      makeNativeMethod("importValues", ReadableNativeMap::importValues),
      makeNativeMethod("importTypes", ReadableNativeMap::importTypes),
  });
}

} // namespace react
} // namespace facebook
