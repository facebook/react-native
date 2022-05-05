/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook {
namespace react {

class Instance;

class EventEmitterWrapper : public jni::HybridClass<EventEmitterWrapper> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/events/EventEmitterWrapper;";

  static void registerNatives();

  SharedEventEmitter eventEmitter;
  EventEmitter const *eventEmitterPointer;

  void invokeEvent(std::string eventName, NativeMap *params, int category);
  void invokeUniqueEvent(
      std::string eventName,
      NativeMap *params,
      int customCoalesceKey);

 private:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook
