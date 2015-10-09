// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <jni/fbjni.h>
#include <react/MethodCall.h>

namespace facebook {
namespace react {

class NativeArray : public jni::HybridClass<NativeArray> {
 public:
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/react/bridge/NativeArray;";

  // Whether this array has been added to another array or map and no longer
  // has a valid array value.
  bool isConsumed = false;
  folly::dynamic array;

  jstring toString();

  static void registerNatives();

 protected:
  friend HybridBase;
  explicit NativeArray(folly::dynamic array);
};

}}
