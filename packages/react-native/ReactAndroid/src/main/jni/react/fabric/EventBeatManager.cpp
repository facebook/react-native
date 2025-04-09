/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventBeatManager.h"

using namespace facebook::jni;

namespace facebook::react {

void EventBeatManager::initHybrid(jni::alias_ref<jhybridobject> jobj) {
  setCxxInstance(jobj);
}

void EventBeatManager::addObserver(
    const EventBeatManagerObserver& observer) const {
  std::scoped_lock lock(mutex_);
  observers_.insert(&observer);
}

void EventBeatManager::removeObserver(
    const EventBeatManagerObserver& observer) const {
  std::scoped_lock lock(mutex_);
  observers_.erase(&observer);
}

void EventBeatManager::tick() {
  std::scoped_lock lock(mutex_);

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

} // namespace facebook::react
