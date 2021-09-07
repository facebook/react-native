/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <memory>

#include <react/renderer/core/BatchedEventQueue.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventPipe.h>
#include <react/renderer/core/EventPriority.h>
#include <react/renderer/core/StatePipe.h>
#include <react/renderer/core/StateUpdate.h>
#include <react/renderer/core/UnbatchedEventQueue.h>

namespace facebook {
namespace react {

class RawEvent;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  using Shared = std::shared_ptr<EventDispatcher const>;
  using Weak = std::weak_ptr<EventDispatcher const>;

  EventDispatcher(
      EventPipe const &eventPipe,
      StatePipe const &statePipe,
      EventBeat::Factory const &synchonousEventBeatFactory,
      EventBeat::Factory const &asynchonousEventBeatFactory,
      EventBeat::SharedOwnerBox const &ownerBox);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(RawEvent const &rawEvent, EventPriority priority) const;

  /*
   * Dispatches a raw event with asynchronous batched priority. Before the
   * dispatch we make sure that no other RawEvent of same type and same target
   * is on the queue.
   */
  void dispatchUniqueEvent(RawEvent const &rawEvent) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchStateUpdate(StateUpdate &&stateUpdate, EventPriority priority)
      const;

 private:
  EventQueue const &getEventQueue(EventPriority priority) const;

  std::unique_ptr<UnbatchedEventQueue> synchronousUnbatchedQueue_;
  std::unique_ptr<BatchedEventQueue> synchronousBatchedQueue_;
  std::unique_ptr<UnbatchedEventQueue> asynchronousUnbatchedQueue_;
  std::unique_ptr<BatchedEventQueue> asynchronousBatchedQueue_;
};

} // namespace react
} // namespace facebook
