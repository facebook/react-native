/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

  if (!beatCallback_) {
    return;
  }

  beatCallback_();
  isRequested_ = false;
}

void EventBeat::induce() const {
  // Default implementation does nothing.
}

void EventBeat::setBeatCallback(const BeatCallback &beatCallback) {
  beatCallback_ = beatCallback;
}

} // namespace react
} // namespace facebook
