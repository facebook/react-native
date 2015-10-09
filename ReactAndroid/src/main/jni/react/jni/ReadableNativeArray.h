 // Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "NativeArray.h"

namespace facebook {
namespace react {

class ReadableNativeArray : public jni::HybridClass<ReadableNativeArray, NativeArray> {
 protected:
  friend HybridBase;
  explicit ReadableNativeArray(folly::dynamic array);

 public:
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableNativeArray;";

  static void mapException(const std::exception& ex);
  jint getSize();
  jboolean isNull(jint index);
  jboolean getBoolean(jint index);
  jint getInt(jint index);
  jdouble getDouble(jint index);
  // The lifetime of the const char* is the same as the underlying dynamic
  // array.  This is fine for converting back to Java, but other uses should be
  // careful.
  const char* getString(jint index);
  jni::local_ref<jhybridobject> getArray(jint index);
  jobject getMap(jint index);
  jobject getType(jint index);

  static void registerNatives();
};

}}
