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
  auto integer = getMapValue(key).getInt();
  jint javaint = static_cast<jint>(integer);
  if (integer != javaint) {
    throwNewJavaException(
      exceptions::gUnexpectedNativeTypeExceptionClass,
      "Value '%lld' doesn't fit into a 32 bit signed int", integer);
  }
  return javaint;
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
      makeNativeMethod("hasKey", ReadableNativeMap::hasKey),
      makeNativeMethod("isNull", ReadableNativeMap::isNull),
      makeNativeMethod("getBoolean", ReadableNativeMap::getBooleanKey),
      makeNativeMethod("getDouble", ReadableNativeMap::getDoubleKey),
      makeNativeMethod("getInt", ReadableNativeMap::getIntKey),
      makeNativeMethod("getString", ReadableNativeMap::getStringKey),
      makeNativeMethod("getArray", ReadableNativeMap::getArrayKey),
      makeNativeMethod("getMap", ReadableNativeMap::getMapKey),
      makeNativeMethod("getType", ReadableNativeMap::getValueType),
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

}  // namespace react
}  // namespace facebook
