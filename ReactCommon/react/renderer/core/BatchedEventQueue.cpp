/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BatchedEventQueue.h"

namespace facebook {
namespace react {

BatchedEventQueue::BatchedEventQueue(
    EventPipe eventPipe,
    StatePipe statePipe,
    std::unique_ptr<EventBeat> eventBeat)
    : EventQueue(eventPipe, statePipe, std::move(eventBeat)) {}

void BatchedEventQueue::onEnqueue() const {
  eventBeat_->request();
}
} // namespace react
} // namespace facebook
