// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "EventBeatManager.h"
#include <fb/fbjni.h>
using namespace facebook::jni;

namespace facebook {
namespace react {

EventBeatManager::EventBeatManager(
  jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject)
  : jhybridobject_(jhybridobject) {}

jni::local_ref<EventBeatManager::jhybriddata> EventBeatManager::initHybrid(
    jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject) {
  return makeCxxInstance(jhybridobject);
}

void EventBeatManager::setRuntimeExecutor(RuntimeExecutor runtimeExecutor) {
  runtimeExecutor_ = runtimeExecutor;
}

void EventBeatManager::registerEventBeat(EventBeat* eventBeat) const {
  std::lock_guard<std::mutex> lock(mutex_);

  registeredEventBeats_.insert(eventBeat);
}

void EventBeatManager::unregisterEventBeat(EventBeat* eventBeat) const {
  std::lock_guard<std::mutex> lock(mutex_);

  registeredEventBeats_.erase(eventBeat);
}

void EventBeatManager::beat() {
  std::lock_guard<std::mutex> lock(mutex_);

  for (const auto eventBeat : registeredEventBeats_) {
    runtimeExecutor_([=](jsi::Runtime &runtime) mutable {
      eventBeat->beat(runtime);
    });
  }
}

void EventBeatManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", EventBeatManager::initHybrid),
      makeNativeMethod("beat", EventBeatManager::beat),
  });
}

} // namespace react
} // namespace facebook
