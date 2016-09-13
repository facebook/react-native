// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeArray.h"

#include <fb/fbjni.h>
#include <folly/json.h>

#include "NativeCommon.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

NativeArray::NativeArray(folly::dynamic a)
    : array(std::move(a)) {
  if (!array.isArray()) {
    throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass,
                               "expected Array, got a %s", array.typeName());
  }
}

local_ref<jstring> NativeArray::toString() {
  exceptions::throwIfObjectAlreadyConsumed(this, "Array already consumed");
  return make_jstring(folly::toJson(array).c_str());
}

void NativeArray::registerNatives() {
  registerHybrid({
    makeNativeMethod("toString", NativeArray::toString),
  });
}

}
}
