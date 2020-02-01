/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StateWrapperImpl.h"
#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

/**
 * Called from Java constructor through the JNI.
 */
jni::local_ref<StateWrapperImpl::jhybriddata> StateWrapperImpl::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jni::local_ref<ReadableNativeMap::jhybridobject> StateWrapperImpl::getState() {
  folly::dynamic map = state_->getDynamic();
  local_ref<ReadableNativeMap::jhybridobject> readableNativeMap =
      ReadableNativeMap::newObjectCxxArgs(map);
  return readableNativeMap;
}

void StateWrapperImpl::updateStateImpl(NativeMap *map) {
  // Get folly::dynamic from map
  auto dynamicMap = map->consume();
  // Set state
  state_->updateState(dynamicMap);
}

void StateWrapperImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", StateWrapperImpl::initHybrid),
      makeNativeMethod("getState", StateWrapperImpl::getState),
      makeNativeMethod("updateStateImpl", StateWrapperImpl::updateStateImpl),
  });
}

} // namespace react
} // namespace facebook
