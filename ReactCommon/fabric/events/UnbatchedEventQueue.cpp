/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UnbatchedEventQueue.h"

namespace facebook {
namespace react {

void UnbatchedEventQueue::enqueueEvent(const RawEvent &rawEvent) const {
  EventQueue::enqueueEvent(rawEvent);

  eventBeat_->request();
  eventBeat_->induce();
}

} // namespace react
} // namespace facebook
