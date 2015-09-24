// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeArray.h"

#include <jni/fbjni.h>
#include <folly/json.h>

namespace facebook {
namespace react {

jni::local_ref<NativeArray::jhybridobject>
createReadableNativeArrayWithContents(folly::dynamic array) {
  if (array.isNull()) {
    return jni::local_ref<NativeArray::jhybridobject>();
  }

  if (!array.isArray()) {
    jni::throwNewJavaException("com/facebook/react/bridge/UnexpectedNativeTypeException",
                               "expected Array, got a %s", array.typeName());
  }

  static auto readableNativeArrayClass =
    jni::findClassStatic("com/facebook/react/bridge/ReadableNativeArray");
  static auto readableNativeArrayCtor =
    readableNativeArrayClass->getConstructor<NativeArray::jhybridobject()>();

  auto jnewArray = readableNativeArrayClass->newObject(readableNativeArrayCtor);
  jni::cthis(jnewArray)->array = std::move(array);
  return jnewArray;
}

jstring NativeArray::toString() {
  if (isConsumed) {
    jni::throwNewJavaException("com/facebook/react/bridge/ObjectAlreadyConsumedException",
                               "Array already consumed");
  }
  return jni::make_jstring(folly::toJson(array).c_str()).release();
}

}
}
