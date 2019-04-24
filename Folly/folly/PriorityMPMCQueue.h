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

#include <glog/logging.h>
#include <algorithm>
#include <vector>

#include <folly/MPMCQueue.h>

namespace folly {

/// PriorityMPMCQueue is a thin wrapper on MPMCQueue, providing priorities
/// by managing multiple underlying MPMCQueues. As of now, this does
/// not implement a blocking interface. For the purposes of this
/// class, lower number is higher priority

template <
    typename T,
    template <typename> class Atom = std::atomic,
    bool Dynamic = false>
class PriorityMPMCQueue {
 public:
  PriorityMPMCQueue(size_t numPriorities, size_t capacity) {
    CHECK_GT(numPriorities, 0);
    queues_.reserve(numPriorities);
    for (size_t i = 0; i < numPriorities; i++) {
      queues_.emplace_back(capacity);
    }
  }

  size_t getNumPriorities() {
    return queues_.size();
  }

  // Add at medium priority by default
  bool write(T&& item) {
    return writeWithPriority(std::move(item), getNumPriorities() / 2);
  }

  bool writeWithPriority(T&& item, size_t priority) {
    size_t queue = std::min(getNumPriorities() - 1, priority);
    CHECK_LT(queue, queues_.size());
    return queues_.at(queue).write(std::move(item));
  }

  bool writeWithPriority(
      T&& item,
      size_t priority,
      std::chrono::milliseconds timeout) {
    size_t queue = std::min(getNumPriorities() - 1, priority);
    CHECK_LT(queue, queues_.size());
    return queues_.at(queue).tryWriteUntil(
        std::chrono::steady_clock::now() + timeout, std::move(item));
  }

  bool read(T& item) {
    for (auto& q : queues_) {
      if (q.readIfNotEmpty(item)) {
        return true;
      }
    }
    return false;
  }

  bool readWithPriority(T& item, size_t priority) {
    return queues_[priority].readIfNotEmpty(item);
  }

  size_t size() const {
    size_t total_size = 0;
    for (auto& q : queues_) {
      // MPMCQueue can have a negative size if there are pending readers.
      // Since we don't expose a blocking interface this shouldn't happen,
      // But just in case we put a floor at 0
      total_size += std::max<ssize_t>(0, q.size());
    }
    return total_size;
  }

  size_t sizeGuess() const {
    size_t total_size = 0;
    for (auto& q : queues_) {
      // MPMCQueue can have a negative size if there are pending readers.
      // Since we don't expose a blocking interface this shouldn't happen,
      // But just in case we put a floor at 0
      total_size += std::max<ssize_t>(0, q.sizeGuess());
    }
    return total_size;
  }

  /// Returns true if there are no items available for dequeue
  bool isEmpty() const {
    return size() == 0;
  }

 private:
  std::vector<folly::MPMCQueue<T, Atom, Dynamic>> queues_;
};

} // namespace folly
