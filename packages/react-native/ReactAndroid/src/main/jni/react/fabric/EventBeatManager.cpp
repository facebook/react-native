/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventBeatManager.h"
#include <fbjni/fbjni.h>
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

void EventBeatManager::addObserver(
    EventBeatManagerObserver const &observer) const {
  std::lock_guard<std::mutex> lock(mutex_);
  observers_.insert(&observer);
}

void EventBeatManager::removeObserver(
    EventBeatManagerObserver const &observer) const {
  std::lock_guard<std::mutex> lock(mutex_);
  observers_.erase(&observer);
}

void EventBeatManager::tick() {
  std::lock_guard<std::mutex> lock(mutex_);

  for (auto observer : observers_) {
    observer->tick();
  }
}

void EventBeatManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", EventBeatManager::initHybrid),
      makeNativeMethod("tick", EventBeatManager::tick),
  });
}

} // namespace react
} // namespace facebook
