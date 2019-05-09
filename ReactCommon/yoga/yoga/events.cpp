/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "events.h"
#include <memory>
#include <stdexcept>

#include <iostream>

namespace facebook {
namespace yoga {

namespace {

// For now, a single subscriber is enough.
// This can be changed as soon as the need for more than one subscriber arises.
std::function<Event::Subscriber>& globalEventSubscriber() {
  static std::function<Event::Subscriber> subscriber = nullptr;
  return subscriber;
}

} // namespace

void Event::reset() {
  globalEventSubscriber() = nullptr;
}

void Event::subscribe(std::function<Subscriber>&& subscriber) {
  if (globalEventSubscriber() != nullptr) {
    throw std::logic_error(
        "Yoga currently supports only one global event subscriber");
  }
  globalEventSubscriber() = std::move(subscriber);
}

void Event::publish(const YGNode& node, Type eventType, const Data& eventData) {
  auto& subscriber = globalEventSubscriber();
  if (subscriber) {
    subscriber(node, eventType, eventData);
  }
}

} // namespace yoga
} // namespace facebook
