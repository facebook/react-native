/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <vector>

#include <fabric/events/EventBeat.h>
#include <fabric/events/primitives.h>
#include <fabric/events/RawEvent.h>

namespace facebook {
namespace react {

/*
 * Event Queue synchronized with given Event Beat and dispatching event
 * using given Event Pipe.
 */
class EventQueue {

public:
  EventQueue(const EventPipe &eventPipe, std::unique_ptr<EventBeat> eventBeat);
  virtual ~EventQueue() = default;

  /*
   * Enqueues and (probably later) dispatch a given event.
   * Can be called on any thread.
   */
  virtual void enqueueEvent(const RawEvent &rawEvent) const;

protected:

  void onBeat() const;

  const EventPipe eventPipe_;
  const std::unique_ptr<EventBeat> eventBeat_;
  mutable std::vector<RawEvent> queue_; // Thread-safe, protected by `queueMutex_`.
  mutable std::mutex queueMutex_;
};

} // namespace react
} // namespace facebook
