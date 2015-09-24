// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <jni/fbjni.h>
#include <react/MethodCall.h>

namespace facebook {
namespace react {

struct NativeArray : public jni::HybridClass<NativeArray> {
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/react/bridge/NativeArray;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>) {
    return makeCxxInstance();
  }

  // Whether this array has been added to another array or map and no longer has a valid array value
  bool isConsumed = false;
  folly::dynamic array = {};

  jstring toString();

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", NativeArray::initHybrid),
        makeNativeMethod("toString", NativeArray::toString),
      });
  }
};

__attribute__((visibility("default")))
jni::local_ref<NativeArray::jhybridobject>
createReadableNativeArrayWithContents(folly::dynamic array);

}}
