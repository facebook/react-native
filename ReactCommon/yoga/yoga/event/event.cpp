/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "event.h"
#include <atomic>
#include <memory>
#include <stdexcept>

namespace facebook {
namespace yoga {

namespace {

struct Node {
  std::function<Event::Subscriber> subscriber = nullptr;
  Node* next = nullptr;

  Node(std::function<Event::Subscriber>&& subscriber)
      : subscriber{std::move(subscriber)} {}
};

std::atomic<Node*> subscribers{nullptr};

Node* push(Node* newHead) {
  Node* oldHead;
  do {
    oldHead = subscribers.load(std::memory_order_relaxed);
    if (newHead != nullptr) {
      newHead->next = oldHead;
    }
  } while (!subscribers.compare_exchange_weak(
      oldHead, newHead, std::memory_order_release, std::memory_order_relaxed));
  return oldHead;
}

} // namespace

void Event::reset() {
  auto head = push(nullptr);
  while (head != nullptr) {
    auto current = head;
    head = head->next;
    delete current;
  }
}

void Event::subscribe(std::function<Subscriber>&& subscriber) {
  push(new Node{std::move(subscriber)});
}

void Event::publish(const YGNode& node, Type eventType, const Data& eventData) {
  for (auto subscriber = subscribers.load(std::memory_order_relaxed);
       subscriber != nullptr;
       subscriber = subscriber->next) {
    subscriber->subscriber(node, eventType, eventData);
  }
}

} // namespace yoga
} // namespace facebook
