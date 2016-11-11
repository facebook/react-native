// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fb/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#include "NativeCommon.h"
#include "NativeMap.h"
#include "ReadableNativeArray.h"

namespace facebook {
namespace react {

struct WritableNativeMap;

struct ReadableNativeMap : jni::HybridClass<ReadableNativeMap, NativeMap> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableNativeMap;";

  bool hasKey(const std::string& key);
  const folly::dynamic& getMapValue(const std::string& key);
  bool isNull(const std::string& key);
  bool getBooleanKey(const std::string& key);
  double getDoubleKey(const std::string& key);
  jint getIntKey(const std::string& key);
  jni::local_ref<jstring> getStringKey(const std::string& key);
  jni::local_ref<ReadableNativeArray::jhybridobject> getArrayKey(const std::string& key);
  jni::local_ref<jhybridobject> getMapKey(const std::string& key);
  jni::local_ref<ReadableType> getValueType(const std::string& key);
  static jni::local_ref<jhybridobject> createWithContents(folly::dynamic&& map);

  static void mapException(const std::exception& ex);

  static void registerNatives();

  using HybridBase::HybridBase;
  friend HybridBase;
  friend struct WritableNativeMap;
};

struct ReadableNativeMapKeySetIterator : jni::HybridClass<ReadableNativeMapKeySetIterator> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableNativeMap$ReadableNativeMapKeySetIterator;";

  ReadableNativeMapKeySetIterator(const folly::dynamic& map);

  bool hasNextKey();
  jni::local_ref<jstring> nextKey();

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>, ReadableNativeMap* nativeMap);
  static void registerNatives();

  folly::dynamic::const_item_iterator iter_;
  // The Java side holds a strong ref to the Java ReadableNativeMap.
  const folly::dynamic& map_;
};

} // namespace react
} // namespace facebook
