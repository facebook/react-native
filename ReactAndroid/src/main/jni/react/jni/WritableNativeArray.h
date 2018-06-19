// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#include "ReadableNativeArray.h"

namespace facebook {
namespace react {

struct WritableNativeMap;

struct WritableNativeArray
    : public jni::HybridClass<WritableNativeArray, ReadableNativeArray> {
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/react/bridge/WritableNativeArray;";

  WritableNativeArray();
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void pushNull();
  void pushBoolean(jboolean value);
  void pushDouble(jdouble value);
  void pushInt(jint value);
  void pushString(jstring value);
  void pushNativeArray(WritableNativeArray* otherArray);
  void pushNativeMap(WritableNativeMap* map);

  static void registerNatives();
};

}
}
