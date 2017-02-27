// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeMap.h"

#include <folly/json.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

std::string NativeMap::toString() {
  throwIfConsumed();
  return ("{ NativeMap: " + folly::toJson(map_) + " }").c_str();
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

}  // namespace react
}  // namespace facebook
