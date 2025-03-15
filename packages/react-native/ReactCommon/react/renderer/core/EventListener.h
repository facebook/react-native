/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <shared_mutex>

#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/RawEvent.h>

namespace facebook::react {

/**
 * Listener for events dispatched to JS runtime.
 * Return `true` to interrupt default dispatch to JS event emitter, `false` to
 * pass through to default handlers.
 */

template <class TEvent>
using EventListenerT = std::function<bool(const TEvent& event)>;

template <class TEvent>
class EventListenerContainerT {
 public:
  /*
   * Invoke listeners in this container with the event.
   * Returns true if event was handled by the listener, false to continue
   * default dispatch.
   */
  bool willDispatchEvent(const TEvent& event) {
    std::shared_lock lock(mutex_);
    bool handled = false;
    for (const auto& listener : eventListeners_) {
      handled = (*listener)(event);
      if (handled) {
        break;
      }
    }
    return handled;
  }

  void addListener(std::shared_ptr<const EventListenerT<TEvent>> listener) {
    std::unique_lock lock(mutex_);
    eventListeners_.push_back(std::move(listener));
  }

  void removeListener(
      const std::shared_ptr<const EventListenerT<TEvent>>& listener) {
    std::unique_lock lock(mutex_);
    auto it =
        std::find(eventListeners_.begin(), eventListeners_.end(), listener);
    if (it != eventListeners_.end()) {
      eventListeners_.erase(it);
    }
  }

 private:
  std::shared_mutex mutex_;
  std::vector<std::shared_ptr<const EventListenerT<TEvent>>> eventListeners_;
};

using EventListener = EventListenerT<RawEvent>;
using EventListenerContainer = EventListenerContainerT<RawEvent>;
using EventEmitterArgs = std::
    tuple<facebook::react::Tag, const std::string&, const SharedEventPayload&>;
using EventEmitterListener = EventListenerT<EventEmitterArgs>;
using SharedEventEmitterListener = std::shared_ptr<const EventEmitterListener>;
using EventEmitterListenerContainer = EventListenerContainerT<EventEmitterArgs>;

} // namespace facebook::react
