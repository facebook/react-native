// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "EventBeatManager.h"
#include <fb/fbjni.h>
using namespace facebook::jni;

namespace facebook {
namespace react {

EventBeatManager::EventBeatManager(Runtime* runtime, jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject) : runtime_(runtime), jhybridobject_(jhybridobject) { }

jni::local_ref<EventBeatManager::jhybriddata> EventBeatManager::initHybrid(
    jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject, jlong jsContext) {
  return makeCxxInstance((Runtime *) jsContext, jhybridobject);
}

void EventBeatManager::registerEventBeat(EventBeat *eventBeat) const {
  std::lock_guard<std::mutex> lock(mutex_);

  registeredEventBeats_.insert(eventBeat);
}

void EventBeatManager::unregisterEventBeat(EventBeat *eventBeat) const {
  std::lock_guard<std::mutex> lock(mutex_);

  registeredEventBeats_.erase(eventBeat);
}

void EventBeatManager::beat() {
  std::lock_guard<std::mutex> lock(mutex_);

  for (const auto eventBeat : registeredEventBeats_) {
    eventBeat->beat(*runtime_);
  }
}

void EventBeatManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", EventBeatManager::initHybrid),
    makeNativeMethod("beat", EventBeatManager::beat),
  });
}

}
}
