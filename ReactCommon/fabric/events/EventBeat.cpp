/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventBeat.h"

namespace facebook {
namespace react {

void EventBeat::request() const {
  isRequested_ = true;
}

void EventBeat::beat() const {
  if (!this->isRequested_) {
    return;
  }

  isRequested_ = false;

  if (beatCallback_) {
    beatCallback_();
  }
}

void EventBeat::induce() const {
  // Default implementation does nothing.
}

void EventBeat::setBeatCallback(const BeatCallback &beatCallback) {
  beatCallback_ = beatCallback;
}

} // namespace react
} // namespace facebook
