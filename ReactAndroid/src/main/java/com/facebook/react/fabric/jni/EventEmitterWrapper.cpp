/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitterWrapper.h"
#include <fbjni/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

jni::local_ref<EventEmitterWrapper::jhybriddata>
EventEmitterWrapper::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void EventEmitterWrapper::invokeEvent(
    std::string eventName,
    NativeMap *payload) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchEvent(
        eventName, payload->consume(), EventPriority::AsynchronousBatched);
  }
}

void EventEmitterWrapper::invokeUniqueEvent(
    std::string eventName,
    NativeMap *payload,
    int customCoalesceKey) {
  // TODO: customCoalesceKey currently unused
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchUniqueEvent(eventName, payload->consume());
  }
}

void EventEmitterWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", EventEmitterWrapper::initHybrid),
      makeNativeMethod("invokeEvent", EventEmitterWrapper::invokeEvent),
      makeNativeMethod(
          "invokeUniqueEvent", EventEmitterWrapper::invokeUniqueEvent),
  });
}

} // namespace react
} // namespace facebook
