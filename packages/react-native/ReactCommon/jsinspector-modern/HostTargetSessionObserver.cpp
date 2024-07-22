/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cassert>

#include "HostTargetSessionObserver.h"

namespace facebook::react::jsinspector_modern {

HostTargetSessionObserver& HostTargetSessionObserver::getInstance() {
  static HostTargetSessionObserver instance;
  return instance;
}

void HostTargetSessionObserver::onHostTargetSessionCreated() {
  ++numberOfActiveSessions_;
  if (numberOfActiveSessions_ == 1) {
    for (auto& subscriber : subscribers_) {
      subscriber.second(true);
    }
  }
}

void HostTargetSessionObserver::onHostTargetSessionDestroyed() {
  assert(
      numberOfActiveSessions_ > 0 &&
      "Unexpected overflow of HostTarget sessions");
  --numberOfActiveSessions_;
  if (numberOfActiveSessions_ == 0) {
    for (auto& subscriber : subscribers_) {
      subscriber.second(false);
    }
  }
}

bool HostTargetSessionObserver::hasActiveSessions() {
  return numberOfActiveSessions_ > 0;
}

std::function<void()> HostTargetSessionObserver::subscribe(
    std::function<void(bool)> callback) {
  auto subscriberIndex = subscriberIndex_++;
  subscribers_.emplace(subscriberIndex, std::move(callback));

  return [&]() { subscribers_.erase(subscriberIndex); };
}

} // namespace facebook::react::jsinspector_modern
