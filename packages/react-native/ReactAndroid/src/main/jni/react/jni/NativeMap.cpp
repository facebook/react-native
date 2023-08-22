/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMap.h"

#include <folly/json.h>

using namespace facebook::jni;

namespace facebook::react {

local_ref<jstring> NativeMap::toString() {
  throwIfConsumed();
  return make_jstring(folly::toJson(map_).c_str());
}

void NativeMap::registerNatives() {
  registerHybrid({
      makeNativeMethod("toString", NativeMap::toString),
  });
}

folly::dynamic NativeMap::consume() {
  throwIfConsumed();
  isConsumed = true;
  return std::move(map_);
}

void NativeMap::throwIfConsumed() {
  exceptions::throwIfObjectAlreadyConsumed(this, "Map already consumed");
}

} // namespace facebook::react
