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
  state_->updateState(dynamicMap, nullptr);
}

void StateWrapperImpl::updateStateWithFailureCallbackImpl(
    NativeMap *map,
    jni::alias_ref<jobject> self,
    int callbackRefId) {
  // Get folly::dynamic from map
  auto dynamicMap = map->consume();
  // Turn the alias into a global_ref
  // Note: this whole thing feels really janky, making StateWrapperImpl.java
  // pass "this" into a function it's calling on "this". But after struggling
  // for a while I couldn't figure out how to get a reference to the Java side
  // of "this" in C++ in a way that's reasonably safe, and it maybe is even
  // discouraged. Anyway, it might be weird, but this seems to work and be safe.
  jni::global_ref<jobject> globalSelf = make_global(self);
  // Set state
  state_->updateState(
      dynamicMap, [globalSelf = std::move(globalSelf), callbackRefId]() {
        static auto method =
            jni::findClassStatic(
                StateWrapperImpl::StateWrapperImplJavaDescriptor)
                ->getMethod<void(jint)>("updateStateFailed");
        method(globalSelf, callbackRefId);
      });
}

void StateWrapperImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", StateWrapperImpl::initHybrid),
      makeNativeMethod("getState", StateWrapperImpl::getState),
      makeNativeMethod("updateStateImpl", StateWrapperImpl::updateStateImpl),
      makeNativeMethod(
          "updateStateWithFailureCallbackImpl",
          StateWrapperImpl::updateStateWithFailureCallbackImpl),
  });
}

} // namespace react
} // namespace facebook
