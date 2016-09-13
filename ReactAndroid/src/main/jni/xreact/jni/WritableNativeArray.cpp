// Copyright 2004-present Facebook. All Rights Reserved.

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
  exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
  array.push_back(nullptr);
}

void WritableNativeArray::pushBoolean(jboolean value) {
  exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
  array.push_back(value == JNI_TRUE);
}

void WritableNativeArray::pushDouble(jdouble value) {
  exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
  array.push_back(value);
}

void WritableNativeArray::pushInt(jint value) {
  exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
  array.push_back(value);
}

void WritableNativeArray::pushString(jstring value) {
  if (value == NULL) {
    pushNull();
    return;
  }
  exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
  array.push_back(wrap_alias(value)->toStdString());
}

void WritableNativeArray::pushNativeArray(WritableNativeArray* otherArray) {
  if (otherArray == NULL) {
    pushNull();
    return;
  }
  exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
  exceptions::throwIfObjectAlreadyConsumed(otherArray, "Array to push already consumed");
  array.push_back(std::move(otherArray->array));
  otherArray->isConsumed = true;
}

void WritableNativeArray::pushNativeMap(WritableNativeMap* map) {
  if (map == NULL) {
    pushNull();
    return;
  }
  exceptions::throwIfObjectAlreadyConsumed(this, "Receiving array already consumed");
  map->throwIfConsumed();
  array.push_back(map->consume());
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
