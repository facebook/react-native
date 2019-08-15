// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "EventEmitterWrapper.h"
#include <fb/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

jni::local_ref<EventEmitterWrapper::jhybriddata>
EventEmitterWrapper::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void EventEmitterWrapper::invokeEvent(
    std::string eventName,
    NativeMap* payload) {
  eventEmitter->dispatchEvent(
      eventName, payload->consume(), EventPriority::AsynchronousBatched);
}

void EventEmitterWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", EventEmitterWrapper::initHybrid),
      makeNativeMethod("invokeEvent", EventEmitterWrapper::invokeEvent),
  });
}

} // namespace react
} // namespace facebook