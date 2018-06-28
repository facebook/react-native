// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "WritableNativeArray.h"

#include "WritableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

WritableNativeArray::WritableNativeArray()
    : HybridBase(folly::dynamic::array()) {}

local_ref<WritableNativeArray::jhybriddata> WritableNativeArray::initHybrid(alias_ref<jclass>) {
  return makeCxxInstance();
}

void WritableNativeArray::pushNull() {
  throwIfConsumed();
  array_.push_back(nullptr);
}

void WritableNativeArray::pushBoolean(jboolean value) {
  throwIfConsumed();
  array_.push_back(value == JNI_TRUE);
}

void WritableNativeArray::pushDouble(jdouble value) {
  throwIfConsumed();
  array_.push_back(value);
}

void WritableNativeArray::pushInt(jint value) {
  throwIfConsumed();
  array_.push_back(value);
}

void WritableNativeArray::pushString(jstring value) {
  if (value == NULL) {
    pushNull();
    return;
  }
  throwIfConsumed();
  array_.push_back(wrap_alias(value)->toStdString());
}

void WritableNativeArray::pushNativeArray(WritableNativeArray* otherArray) {
  if (otherArray == NULL) {
    pushNull();
    return;
  }
  throwIfConsumed();
  array_.push_back(otherArray->consume());
}

void WritableNativeArray::pushNativeMap(WritableNativeMap* map) {
  if (map == NULL) {
    pushNull();
    return;
  }
  throwIfConsumed();
  array_.push_back(map->consume());
}

void WritableNativeArray::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", WritableNativeArray::initHybrid),
      makeNativeMethod("pushNull", WritableNativeArray::pushNull),
      makeNativeMethod("pushBoolean", WritableNativeArray::pushBoolean),
      makeNativeMethod("pushDouble", WritableNativeArray::pushDouble),
      makeNativeMethod("pushInt", WritableNativeArray::pushInt),
      makeNativeMethod("pushString", WritableNativeArray::pushString),
      makeNativeMethod("pushNativeArray", WritableNativeArray::pushNativeArray),
      makeNativeMethod("pushNativeMap", WritableNativeArray::pushNativeMap),
  });
}

} // namespace react
} // namespace facebook
