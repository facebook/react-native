/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StateWrapperImpl.h"
#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

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

jni::local_ref<ReadableNativeMap::jhybridobject>
StateWrapperImpl::getStateDataImpl() {
  folly::dynamic map = state_->getDynamic();
  return ReadableNativeMap::newObjectCxxArgs(std::move(map));
}

jni::local_ref<JReadableMapBuffer::jhybridobject>
StateWrapperImpl::getStateMapBufferDataImpl() {
  MapBuffer map = state_->getMapBuffer();
  return JReadableMapBuffer::createWithContents(std::move(map));
}

void StateWrapperImpl::updateStateImpl(NativeMap *map) {
  // Get folly::dynamic from map
  auto dynamicMap = map->consume();
  // Set state
  state_->updateState(std::move(dynamicMap));
}

void StateWrapperImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", StateWrapperImpl::initHybrid),
      makeNativeMethod("getStateDataImpl", StateWrapperImpl::getStateDataImpl),
      makeNativeMethod("updateStateImpl", StateWrapperImpl::updateStateImpl),
      makeNativeMethod(
          "getStateMapBufferDataImpl",
          StateWrapperImpl::getStateMapBufferDataImpl),
  });
}

} // namespace react
} // namespace facebook
