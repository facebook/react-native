/*
 * Copyright 2017-present Facebook, Inc.
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

#pragma once

#include <folly/Executor.h>
#include <folly/MPMCQueue.h>
#include <folly/Range.h>
#include <folly/executors/task_queue/BlockingQueue.h>
#include <folly/synchronization/LifoSem.h>
#include <glog/logging.h>

namespace folly {

template <class T, QueueBehaviorIfFull kBehavior = QueueBehaviorIfFull::THROW>
class PriorityLifoSemMPMCQueue : public BlockingQueue<T> {
 public:
  // Note A: The queue pre-allocates all memory for max_capacity
  // Note B: To use folly::Executor::*_PRI, for numPriorities == 2
  //         MID_PRI and HI_PRI are treated at the same priority level.
  PriorityLifoSemMPMCQueue(uint8_t numPriorities, size_t max_capacity) {
    queues_.reserve(numPriorities);
    for (int8_t i = 0; i < numPriorities; i++) {
      queues_.emplace_back(max_capacity);
    }
  }

  PriorityLifoSemMPMCQueue(folly::Range<const size_t*> capacities) {
    CHECK_LT(capacities.size(), 256) << "At most 255 priorities supported";

    queues_.reserve(capacities.size());
    for (auto capacity : capacities) {
      queues_.emplace_back(capacity);
    }
  }

  uint8_t getNumPriorities() override {
    return queues_.size();
  }

  // Add at medium priority by default
  BlockingQueueAddResult add(T item) override {
    return addWithPriority(std::move(item), folly::Executor::MID_PRI);
  }

  BlockingQueueAddResult addWithPriority(T item, int8_t priority) override {
    int mid = getNumPriorities() / 2;
    size_t queue = priority < 0
        ? std::max(0, mid + priority)
        : std::min(getNumPriorities() - 1, mid + priority);
    CHECK_LT(queue, queues_.size());
    switch (kBehavior) { // static
      case QueueBehaviorIfFull::THROW:
        if (!queues_[queue].write(std::move(item))) {
          throw QueueFullException("LifoSemMPMCQueue full, can't add item");
        }
        break;
      case QueueBehaviorIfFull::BLOCK:
        queues_[queue].blockingWrite(std::move(item));
        break;
    }
    return sem_.post();
  }

  T take() override {
    T item;
    while (true) {
      if (nonBlockingTake(item)) {
        return item;
      }
      sem_.wait();
    }
  }

  folly::Optional<T> try_take_for(std::chrono::milliseconds time) override {
    T item;
    while (true) {
      if (nonBlockingTake(item)) {
        return std::move(item);
      }
      if (!sem_.try_wait_for(time)) {
        return folly::none;
      }
    }
  }

  bool nonBlockingTake(T& item) {
    for (auto it = queues_.rbegin(); it != queues_.rend(); it++) {
      if (it->readIfNotEmpty(item)) {
        return true;
      }
    }
    return false;
  }

  size_t size() override {
    size_t size = 0;
    for (auto& q : queues_) {
      size += q.size();
    }
    return size;
  }

  size_t sizeGuess() const {
    size_t size = 0;
    for (auto& q : queues_) {
      size += q.sizeGuess();
    }
    return size;
  }

 private:
  folly::LifoSem sem_;
  std::vector<folly::MPMCQueue<T>> queues_;
};

} // namespace folly
