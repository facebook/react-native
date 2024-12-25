/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitterWrapper.h"
#include <fbjni/fbjni.h>

using namespace facebook::jni;

namespace facebook::react {

void EventEmitterWrapper::dispatchEvent(
    std::string eventName,
    NativeMap* payload,
    int category) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchEvent(
        eventName,
        payload ? payload->consume() : folly::dynamic::object(),
        static_cast<RawEvent::Category>(category));
  }
}

void EventEmitterWrapper::dispatchEventSynchronously(
    std::string eventName,
    NativeMap* params) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->experimental_flushSync([&]() {
      eventEmitter->dispatchEvent(
          std::move(eventName),
          (params != nullptr) ? params->consume() : folly::dynamic::object(),
          RawEvent::Category::Discrete);
    });
  }
}

void EventEmitterWrapper::dispatchUniqueEvent(
    std::string eventName,
    NativeMap* payload) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchUniqueEvent(
        eventName, payload ? payload->consume() : folly::dynamic::object());
  }
}

void EventEmitterWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("dispatchEvent", EventEmitterWrapper::dispatchEvent),
      makeNativeMethod(
          "dispatchUniqueEvent", EventEmitterWrapper::dispatchUniqueEvent),
      makeNativeMethod(
          "dispatchEventSynchronously",
          EventEmitterWrapper::dispatchEventSynchronously),
  });
}

} // namespace facebook::react
