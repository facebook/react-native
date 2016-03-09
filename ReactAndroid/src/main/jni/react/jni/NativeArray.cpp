// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeArray.h"

#include <jni/fbjni.h>
#include <folly/json.h>

namespace facebook {
namespace react {

NativeArray::NativeArray(folly::dynamic a)
    : array(std::move(a)) {
  if (!array.isArray()) {
    jni::throwNewJavaException("com/facebook/react/bridge/UnexpectedNativeTypeException",
                               "expected Array, got a %s", array.typeName());
  }
}

jstring NativeArray::toString() {
  if (isConsumed) {
    jni::throwNewJavaException("com/facebook/react/bridge/ObjectAlreadyConsumedException",
                               "Array already consumed");
  }
  return jni::make_jstring(folly::toJson(array).c_str()).release();
}

void NativeArray::registerNatives() {
  registerHybrid({
    makeNativeMethod("toString", NativeArray::toString),
  });
}

}
}
