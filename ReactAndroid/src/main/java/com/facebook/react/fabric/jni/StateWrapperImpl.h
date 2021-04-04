/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/common/mapbuffer/ReadableMapBuffer.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/State.h>

namespace facebook {
namespace react {

class Instance;

class StateWrapperImpl : public jni::HybridClass<StateWrapperImpl> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/StateWrapperImpl;";
  constexpr static auto StateWrapperImplJavaDescriptor =
      "com/facebook/react/fabric/StateWrapperImpl";

  static void registerNatives();

  jni::local_ref<ReadableMapBuffer::jhybridobject> getStateMapBufferDataImpl();
  jni::local_ref<ReadableNativeMap::jhybridobject> getStateDataImpl();
  void updateStateImpl(NativeMap *map);
  void updateStateWithFailureCallbackImpl(
      NativeMap *map,
      jni::alias_ref<jobject> self,
      int callbackRefId);

  State::Shared state_;

 private:
  jni::alias_ref<StateWrapperImpl::jhybriddata> jhybridobject_;

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook
