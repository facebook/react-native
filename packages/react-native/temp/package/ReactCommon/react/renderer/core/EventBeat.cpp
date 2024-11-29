/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventBeat.h"

#include <utility>

namespace facebook::react {

EventBeat::EventBeat(SharedOwnerBox ownerBox)
    : ownerBox_(std::move(ownerBox)) {}

void EventBeat::request() const {
  isRequested_ = true;
}

void EventBeat::beat(jsi::Runtime& runtime) const {
  if (!this->isRequested_) {
    return;
  }

  isRequested_ = false;

  if (beatCallback_) {
    beatCallback_(runtime);
  }
}

void EventBeat::induce() const {
  // Default implementation does nothing.
}

void EventBeat::setBeatCallback(BeatCallback beatCallback) {
  beatCallback_ = std::move(beatCallback);
}

} // namespace facebook::react
