// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fb/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#include "ReadableNativeMap.h"
#include "WritableNativeArray.h"

namespace facebook {
namespace react {

struct WritableNativeMap : jni::HybridClass<WritableNativeMap, ReadableNativeMap> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/WritableNativeMap;";

  WritableNativeMap();
  WritableNativeMap(folly::dynamic&& val);

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  folly::dynamic consume();

  void putNull(std::string key);
  void putBoolean(std::string key, bool val);
  void putDouble(std::string key, double val);
  void putInt(std::string key, int val);
  void putString(std::string key, jni::alias_ref<jstring> val);
  void putNativeArray(std::string key, jni::alias_ref<WritableNativeArray::jhybridobject> val);
  void putNativeMap(std::string key, jni::alias_ref<jhybridobject> val);
  void mergeNativeMap(ReadableNativeMap* other);

  static void registerNatives();

  friend HybridBase;
};

} // namespace react
} // namespace facebook
