// Copyright 2004-present Facebook. All Rights Reserved.

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {
const char *gNoSuchKeyExceptionClass = "com/facebook/react/bridge/NoSuchKeyException";
} // namespace

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
  for (jint i = 0; i < size; i++) {
    (*jarray)[i] = make_jstring(keys_.value()[i].getString());
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importValues() {
  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint i = 0; i < size; i++) {
    std::string key = keys_.value()[i].getString().c_str();
    const auto element = map_.at(key);
    switch(element.type()) {
      case folly::dynamic::Type::NULLT: {
        jarray->setElement(i, nullptr);
        break;
      }
      case folly::dynamic::Type::BOOL: {
        (*jarray)[i] =
              JBoolean::valueOf(ReadableNativeMap::getBooleanKey(key));
        break;
      }
      case folly::dynamic::Type::INT64:
      case folly::dynamic::Type::DOUBLE: {
        (*jarray)[i] =
          JDouble::valueOf(ReadableNativeMap::getDoubleKey(key));
        break;
      }
      case folly::dynamic::Type::STRING: {
        (*jarray)[i] = ReadableNativeMap::getStringKey(key);
        break;
      }
      case folly::dynamic::Type::OBJECT: {
        (*jarray)[i] = ReadableNativeMap::getMapKey(key);
        break;
      }
      case folly::dynamic::Type::ARRAY: {
        (*jarray)[i] = ReadableNativeMap::getArrayKey(key);
        break;
      }
      default: {
        jarray->setElement(i,nullptr);
        break;
      }
    }
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importTypes() {
  jint size = keys_.value().size();
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint i = 0; i < size; i++) {
    std::string key = keys_.value()[i].getString().c_str();
    (*jarray)[i] = ReadableNativeMap::getValueType(key);
  }
  return jarray;
}

bool ReadableNativeMap::hasKey(const std::string& key) {
  return map_.find(key) != map_.items().end();
}

const folly::dynamic& ReadableNativeMap::getMapValue(const std::string& key) {
  try {
    return map_.at(key);
  } catch (const std::out_of_range& ex) {
    throwNewJavaException(gNoSuchKeyExceptionClass, ex.what());
  }
}

bool ReadableNativeMap::isNull(const std::string& key) {
  return getMapValue(key).isNull();
}

bool ReadableNativeMap::getBooleanKey(const std::string& key) {
  return getMapValue(key).getBool();
}

double ReadableNativeMap::getDoubleKey(const std::string& key) {
  const folly::dynamic& val = getMapValue(key);
  if (val.isInt()) {
    return val.getInt();
  }
  return val.getDouble();
}

jint ReadableNativeMap::getIntKey(const std::string& key) {
  const folly::dynamic& val = getMapValue(key);
  int64_t integer = convertDynamicIfIntegral(val);
  return makeJIntOrThrow(integer);
}

local_ref<jstring> ReadableNativeMap::getStringKey(const std::string& key) {
  const folly::dynamic& val = getMapValue(key);
  if (val.isNull()) {
    return local_ref<jstring>(nullptr);
  }
  return make_jstring(val.getString().c_str());
}

local_ref<ReadableNativeArray::jhybridobject> ReadableNativeMap::getArrayKey(const std::string& key) {
  auto& value = getMapValue(key);
  if (value.isNull()) {
    return local_ref<ReadableNativeArray::jhybridobject>(nullptr);
  } else {
    return ReadableNativeArray::newObjectCxxArgs(value);
  }
}

local_ref<ReadableNativeMap::jhybridobject> ReadableNativeMap::getMapKey(const std::string& key) {
  auto& value = getMapValue(key);
  if (value.isNull()) {
    return local_ref<ReadableNativeMap::jhybridobject>(nullptr);
  } else if (!value.isObject()) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass,
                          "expected Map, got a %s", value.typeName());
  } else {
    return ReadableNativeMap::newObjectCxxArgs(value);
  }
}

local_ref<ReadableType> ReadableNativeMap::getValueType(const std::string& key) {
  return ReadableType::getType(getMapValue(key).type());
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
      makeNativeMethod("hasKeyNative", ReadableNativeMap::hasKey),
      makeNativeMethod("isNullNative", ReadableNativeMap::isNull),
      makeNativeMethod("getBooleanNative", ReadableNativeMap::getBooleanKey),
      makeNativeMethod("getDoubleNative", ReadableNativeMap::getDoubleKey),
      makeNativeMethod("getIntNative", ReadableNativeMap::getIntKey),
      makeNativeMethod("getStringNative", ReadableNativeMap::getStringKey),
      makeNativeMethod("getArrayNative", ReadableNativeMap::getArrayKey),
      makeNativeMethod("getMapNative", ReadableNativeMap::getMapKey),
      makeNativeMethod("getTypeNative", ReadableNativeMap::getValueType),
  });
}

ReadableNativeMapKeySetIterator::ReadableNativeMapKeySetIterator(const folly::dynamic& map)
  : iter_(map.items().begin())
  , map_(map) {}

local_ref<ReadableNativeMapKeySetIterator::jhybriddata> ReadableNativeMapKeySetIterator::initHybrid(alias_ref<jclass>, ReadableNativeMap* nativeMap) {
  return makeCxxInstance(nativeMap->map_);
}

bool ReadableNativeMapKeySetIterator::hasNextKey() {
  return iter_ != map_.items().end();
}

local_ref<jstring> ReadableNativeMapKeySetIterator::nextKey() {
  if (!hasNextKey()) {
    throwNewJavaException("com/facebook/react/bridge/InvalidIteratorException",
                          "No such element exists");
  }
  auto ret = make_jstring(iter_->first.c_str());
  ++iter_;
  return ret;
}

void ReadableNativeMapKeySetIterator::registerNatives() {
  registerHybrid({
      makeNativeMethod("hasNextKey", ReadableNativeMapKeySetIterator::hasNextKey),
      makeNativeMethod("nextKey", ReadableNativeMapKeySetIterator::nextKey),
      makeNativeMethod("initHybrid", ReadableNativeMapKeySetIterator::initHybrid),
    });
}

jint makeJIntOrThrow(int64_t integer) {
  jint javaint = static_cast<jint>(integer);
  if (integer != javaint) {
    throwNewJavaException(
      exceptions::gUnexpectedNativeTypeExceptionClass,
      "Value '%lld' doesn't fit into a 32 bit signed int", integer);
  }
  return javaint;
}

int64_t convertDynamicIfIntegral(const folly::dynamic& val) {
  if (val.isInt()) {
    return val.getInt();
  }
  double dbl = val.getDouble();
  int64_t result = static_cast<int64_t>(dbl);
  if (dbl != result) {
    throwNewJavaException(
      exceptions::gUnexpectedNativeTypeExceptionClass,
      "Tried to read an int, but got a non-integral double: %f", dbl);
  }
  return result;
}

}  // namespace react
}  // namespace facebook
