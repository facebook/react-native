/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <array>
#include <memory>

#include <react/core/EventBeat.h>
#include <react/core/EventPipe.h>
#include <react/core/EventPriority.h>
#include <react/core/EventQueue.h>
#include <react/core/StatePipe.h>

namespace facebook {
namespace react {

class RawEvent;
class StateUpdate;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  using Shared = std::shared_ptr<const EventDispatcher>;
  using Weak = std::weak_ptr<const EventDispatcher>;

  EventDispatcher(
      const EventPipe &eventPipe,
      const StatePipe &statePipe,
      const EventBeatFactory &synchonousEventBeatFactory,
      const EventBeatFactory &asynchonousEventBeatFactory);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(const RawEvent &rawEvent, EventPriority priority) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchStateUpdate(StateUpdate &&stateUpdate, EventPriority priority)
      const;

 private:
  const EventQueue &getEventQueue(EventPriority priority) const;

  std::array<std::unique_ptr<EventQueue>, 4> eventQueues_;
};

} // namespace react
} // namespace facebook
