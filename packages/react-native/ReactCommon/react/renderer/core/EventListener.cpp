/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventListener.h"

#include <mutex>

namespace facebook::react {

bool EventListenerContainer::willDispatchEvent(const RawEvent& event) {
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

void EventListenerContainer::addListener(
    std::shared_ptr<const EventListener> listener) {
  std::unique_lock lock(mutex_);

  eventListeners_.push_back(std::move(listener));
}

void EventListenerContainer::removeListener(
    const std::shared_ptr<const EventListener>& listener) {
  std::unique_lock lock(mutex_);

  auto it = std::find(eventListeners_.begin(), eventListeners_.end(), listener);
  if (it != eventListeners_.end()) {
    eventListeners_.erase(it);
  }
}

} // namespace facebook::react
