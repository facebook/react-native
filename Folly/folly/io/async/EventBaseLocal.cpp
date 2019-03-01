/*
 * Copyright 2017 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/io/async/EventBaseLocal.h>
#include <atomic>
#include <thread>

namespace folly { namespace detail {

EventBaseLocalBase::~EventBaseLocalBase() {
  // There's a race condition if an EventBase and an EventBaseLocal destruct
  // at the same time (each will lock eventBases_ and localStorageMutex_
  // in the opposite order), so we dance around it with a loop and try_lock.
  while (true) {
    SYNCHRONIZED(eventBases_) {
      auto it = eventBases_.begin();
      while (it != eventBases_.end()) {
        auto evb = *it;
        if (evb->localStorageMutex_.try_lock()) {
          evb->localStorage_.erase(key_);
          evb->localStorageToDtor_.erase(this);
          it = eventBases_.erase(it);
          evb->localStorageMutex_.unlock();
        } else {
          ++it;
        }
      }

      if (eventBases_.empty()) {
        return;
      }
    }
    std::this_thread::yield(); // let the other thread take the eventBases_ lock
  }
}

void* EventBaseLocalBase::getVoid(EventBase& evb) {
  std::lock_guard<std::mutex> lg(evb.localStorageMutex_);
  auto it2 = evb.localStorage_.find(key_);
  if (UNLIKELY(it2 != evb.localStorage_.end())) {
    return it2->second.get();
  }

  return nullptr;
}

void EventBaseLocalBase::erase(EventBase& evb) {
  std::lock_guard<std::mutex> lg(evb.localStorageMutex_);
  evb.localStorage_.erase(key_);
  evb.localStorageToDtor_.erase(this);

  SYNCHRONIZED(eventBases_) {
    eventBases_.erase(&evb);
  }
}

void EventBaseLocalBase::onEventBaseDestruction(EventBase& evb) {
  SYNCHRONIZED(eventBases_) {
    eventBases_.erase(&evb);
  }
}

void EventBaseLocalBase::setVoid(EventBase& evb, std::shared_ptr<void>&& ptr) {
  std::lock_guard<std::mutex> lg(evb.localStorageMutex_);
  setVoidUnlocked(evb, std::move(ptr));
}

void EventBaseLocalBase::setVoidUnlocked(
    EventBase& evb, std::shared_ptr<void>&& ptr) {

  auto alreadyExists =
    evb.localStorage_.find(key_) != evb.localStorage_.end();

  evb.localStorage_.emplace(key_, std::move(ptr));

  if (!alreadyExists) {
    SYNCHRONIZED(eventBases_) {
      eventBases_.insert(&evb);
    }
    evb.localStorageToDtor_.insert(this);
  }
}

std::atomic<uint64_t> EventBaseLocalBase::keyCounter_{0};
}}
