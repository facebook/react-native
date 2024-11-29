/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WritableNativeArray.h"

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook::react {

WritableNativeArray::WritableNativeArray()
    : HybridBase(folly::dynamic::array()) {}

WritableNativeArray::WritableNativeArray(folly::dynamic&& val)
    : HybridBase(std::move(val)) {
  if (!array_.isArray()) {
    throw std::runtime_error("WritableNativeArray value must be an array.");
  }
}

void WritableNativeArray::initHybrid(alias_ref<jhybridobject> jobj) {
  setCxxInstance(jobj);
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

void WritableNativeArray::pushLong(jlong value) {
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

void WritableNativeArray::pushNativeArray(ReadableNativeArray* otherArray) {
  if (otherArray == NULL) {
    pushNull();
    return;
  }
  throwIfConsumed();
  array_.push_back(otherArray->consume());
}

void WritableNativeArray::pushNativeMap(ReadableNativeMap* map) {
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
      makeNativeMethod("pushLong", WritableNativeArray::pushLong),
      makeNativeMethod("pushString", WritableNativeArray::pushString),
      makeNativeMethod("pushNativeArray", WritableNativeArray::pushNativeArray),
      makeNativeMethod("pushNativeMap", WritableNativeArray::pushNativeMap),
  });
}

} // namespace facebook::react
