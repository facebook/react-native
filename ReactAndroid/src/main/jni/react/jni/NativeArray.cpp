// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeArray.h"

#include <fb/fbjni.h>
#include <folly/json.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

NativeArray::NativeArray(folly::dynamic array)
    : isConsumed(false), array_(std::move(array)) {
  if (!array_.isArray()) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass,
                               "expected Array, got a %s", array_.typeName());
  }
}

local_ref<jstring> NativeArray::toString() {
  throwIfConsumed();
  return make_jstring(folly::toJson(array_).c_str());
}

void NativeArray::registerNatives() {
  registerHybrid({
    makeNativeMethod("toString", NativeArray::toString),
  });
}

folly::dynamic NativeArray::consume() {
  throwIfConsumed();
  isConsumed = true;
  return std::move(array_);
}

void NativeArray::throwIfConsumed() {
  exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
}

}
}
