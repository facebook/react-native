// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

void ReadableNativeMap::mapException(const std::exception& ex) {
  if (dynamic_cast<const folly::TypeError*>(&ex) != nullptr) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, ex.what());
  }
}

local_ref<JArrayClass<jstring>> ReadableNativeMap::importKeys() {
  auto pairs = map_.items();
  keys_ = folly::dynamic::array();
  for (auto &pair : pairs) {
    keys_.value().push_back(pair.first.asString());
  }
  jint size = keys_.value().size();
  auto jarray = JArrayClass<jstring>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    (*jarray)[ii] = make_jstring(keys_.value()[ii].getString());
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importValues() {
  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    const std::string &key = keys_.value()[ii].getString();
    const auto &element = map_.at(key);
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
        (*jarray)[ii] = ReadableNativeMap::newObjectCxxArgs(element);
        break;
      }
      case folly::dynamic::Type::ARRAY: {
        (*jarray)[ii] = ReadableNativeArray::newObjectCxxArgs(element);
        break;
      }
      default: {
        jarray->setElement(ii, nullptr);
        break;
      }
    }
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importTypes() {
  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    const std::string &key = keys_.value()[ii].getString();
    (*jarray)[ii] = ReadableType::getType(map_.at(key).type());
  }
  return jarray;
}

local_ref<ReadableNativeMap::jhybridobject> ReadableNativeMap::createWithContents(folly::dynamic&& map) {
  if (map.isNull()) {
    return local_ref<jhybridobject>(nullptr);
  }

  if (!map.isObject()) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass,
                          "expected Map, got a %s", map.typeName());
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

}  // namespace react
}  // namespace facebook
