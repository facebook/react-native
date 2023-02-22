/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeArray.h"

#include <folly/json.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

void NativeArray::assertInternalType() {
  if (!array_.isArray()) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass,
        "expected Array, got a %s",
        array_.typeName());
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

} // namespace react
} // namespace facebook
