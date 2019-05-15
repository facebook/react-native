/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "event.h"
#include <memory>
#include <stdexcept>

#include <iostream>

namespace facebook {
namespace yoga {

namespace {

Event::Subscribers& eventSubscribers() {
  static Event::Subscribers subscribers = {};
  return subscribers;
}

} // namespace

void Event::reset() {
  eventSubscribers() = {};
}

void Event::subscribe(std::function<Subscriber>&& subscriber) {
  eventSubscribers().push_back(subscriber);
}

void Event::publish(const YGNode& node, Type eventType, const Data& eventData) {
  for (auto& subscriber : eventSubscribers()) {
    if (subscriber) {
      subscriber(node, eventType, eventData);
    }
  }
}

} // namespace yoga
} // namespace facebook
