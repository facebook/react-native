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
#include <react/core/RawEvent.h>

namespace facebook {
namespace react {

class EventDispatcher;
using SharedEventDispatcher = std::shared_ptr<const EventDispatcher>;
using WeakEventDispatcher = std::weak_ptr<const EventDispatcher>;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  EventDispatcher(
      const EventPipe &eventPipe,
      const EventBeatFactory &synchonousEventBeatFactory,
      const EventBeatFactory &asynchonousEventBeatFactory);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(const RawEvent &rawEvent, EventPriority priority) const;

 private:
  std::array<std::unique_ptr<EventQueue>, 4> eventQueues_;
};

} // namespace react
} // namespace facebook
