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

namespace facebook::react {

/**
 * Called from Java constructor through the JNI.
 */
jni::local_ref<StateWrapperImpl::jhybriddata> StateWrapperImpl::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jni::local_ref<ReadableNativeMap::jhybridobject>
StateWrapperImpl::getStateDataImpl() {
  if (auto state = state_.lock()) {
    folly::dynamic map = state->getDynamic();
    return ReadableNativeMap::newObjectCxxArgs(std::move(map));
  } else {
    return nullptr;
  }
}

jni::local_ref<JReadableMapBuffer::jhybridobject>
StateWrapperImpl::getStateMapBufferDataImpl() {
  if (auto state = state_.lock()) {
    MapBuffer map = state->getMapBuffer();
    return JReadableMapBuffer::createWithContents(std::move(map));
  } else {
    return nullptr;
  }
}

void StateWrapperImpl::updateStateImpl(NativeMap* map) {
  if (auto state = state_.lock()) {
    // Get folly::dynamic from map
    auto dynamicMap = map->consume();
    // Set state
    state->updateState(std::move(dynamicMap));
  }
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

} // namespace facebook::react
