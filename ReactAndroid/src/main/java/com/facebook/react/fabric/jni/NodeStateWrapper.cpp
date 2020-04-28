// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "NodeStateWrapper.h"
#include <fb/fbjni.h>
#include <react/jni/ReadableNativeMap.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

jni::local_ref<NodeStateWrapper::jhybriddata>
NodeStateWrapper::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jni::local_ref<ReadableNativeMap::jhybridobject> NodeStateWrapper::getState() {
  folly::dynamic map = state_->getDynamic();
  local_ref<ReadableNativeMap::jhybridobject> readableNativeMap =
      ReadableNativeMap::newObjectCxxArgs(map);
  return readableNativeMap;
}

void NodeStateWrapper::updateState(ReadableNativeMap* map) {
  // Get folly::dynamic from map
  auto dynamicMap = map->consume();
  // Set state
  state_->updateState(dynamicMap);
}

void NodeStateWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("getState", NodeStateWrapper::getState),
      makeNativeMethod("updateState", NodeStateWrapper::updateState),
  });
}

} // namespace react
} // namespace facebook
