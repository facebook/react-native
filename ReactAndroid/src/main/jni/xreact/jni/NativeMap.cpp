// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeMap.h"

#include "NativeCommon.h"

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

void NativeMap::throwIfConsumed() {
  exceptions::throwIfObjectAlreadyConsumed(this, "Map already consumed");
}

}  // namespace react
}  // namespace facebook
