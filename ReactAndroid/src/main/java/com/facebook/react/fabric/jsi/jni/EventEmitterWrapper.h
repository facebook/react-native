// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
#include <react/core/EventEmitter.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook {
namespace react {

class Instance;

class EventEmitterWrapper : public jni::HybridClass<EventEmitterWrapper> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/jsi/EventEmitterWrapper;";

  static void registerNatives();

  SharedEventEmitter eventEmitter;

  void invokeEvent(std::string eventName, NativeMap* params);

 private:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook
