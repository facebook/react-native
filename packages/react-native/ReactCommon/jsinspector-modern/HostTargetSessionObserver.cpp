/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cassert>
#include <memory>
#include <mutex>

#include "HostTargetSessionObserver.h"

namespace facebook::react::jsinspector_modern {

HostTargetSessionObserver& HostTargetSessionObserver::getInstance() {
  static HostTargetSessionObserver instance;
  return instance;
}

// Will be called by HostTargetSession on inspector thread.
void HostTargetSessionObserver::onHostTargetSessionCreated() {
  std::lock_guard<std::mutex> lock(mutex_);

  ++activeSessionCount_;
  if (activeSessionCount_ == 1) {
    for (auto& subscriber : subscribers_) {
      subscriber.second(true);
    }
  }
}

// Will be called by HostTargetSession on inspector thread.
void HostTargetSessionObserver::onHostTargetSessionDestroyed() {
  std::lock_guard<std::mutex> lock(mutex_);

  assert(
      activeSessionCount_ > 0 && "Unexpected overflow of HostTarget sessions");
  --activeSessionCount_;
  if (activeSessionCount_ == 0) {
    for (auto& subscriber : subscribers_) {
      subscriber.second(false);
    }
  }
}

// Will be called by NativeDebuggerSessionObserver on JS thread.
bool HostTargetSessionObserver::hasActiveSessions() {
  std::lock_guard<std::mutex> lock(mutex_);

  return activeSessionCount_ > 0;
}

// Will be called by NativeDebuggerSessionObserver on JS thread.
std::function<void()> HostTargetSessionObserver::subscribe(
    std::function<void(bool)> callback) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto subscriberIndex = subscriberIndex_++;
  subscribers_.emplace(subscriberIndex, std::move(callback));

  // Since HostTargetSessionObserver is a singleton, it is expected to outlive
  // all potential subscribers
  return [this, subscriberIndexToRemove = subscriberIndex]() {
    std::lock_guard<std::mutex> lockForCallback(mutex_);
    subscribers_.erase(subscriberIndexToRemove);
  };
}

} // namespace facebook::react::jsinspector_modern
