/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "event.h"
#include <memory>
#include <stdexcept>
#include <mutex>

#include <iostream>

namespace facebook {
namespace yoga {

namespace {

std::mutex& eventSubscribersMutex() {
  static std::mutex subscribersMutex;
  return subscribersMutex;
}

std::shared_ptr<Event::Subscribers>& eventSubscribers() {
  static auto subscribers = std::make_shared<Event::Subscribers>();
  return subscribers;
}

} // namespace

void Event::reset() {
  eventSubscribers() = std::make_shared<Event::Subscribers>();
}

void Event::subscribe(std::function<Subscriber>&& subscriber) {
  std::lock_guard<std::mutex> guard(eventSubscribersMutex());
  eventSubscribers()->push_back(subscriber);
}

void Event::publish(const YGNode& node, Type eventType, const Data& eventData) {
  for (auto& subscriber : *eventSubscribers()) {
    if (subscriber) {
      subscriber(node, eventType, eventData);
    }
  }
}

} // namespace yoga
} // namespace facebook
