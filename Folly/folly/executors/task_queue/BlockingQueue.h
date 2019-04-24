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

#include <chrono>
#include <exception>
#include <stdexcept>

#include <glog/logging.h>

#include <folly/CPortability.h>
#include <folly/Optional.h>

namespace folly {

// Some queue implementations (for example, LifoSemMPMCQueue or
// PriorityLifoSemMPMCQueue) support both blocking (BLOCK) and
// non-blocking (THROW) behaviors.
enum class QueueBehaviorIfFull { THROW, BLOCK };

class FOLLY_EXPORT QueueFullException : public std::runtime_error {
  using std::runtime_error::runtime_error; // Inherit constructors.
};

struct BlockingQueueAddResult {
  BlockingQueueAddResult(bool reused = false) : reusedThread(reused) {}
  bool reusedThread;
};

template <class T>
class BlockingQueue {
 public:
  virtual ~BlockingQueue() = default;
  // Adds item to the queue (with priority).
  //
  // Returns true if an existing thread was able to work on it (used
  // for dynamically sizing thread pools), false otherwise.  Return false
  // if this feature is not supported.
  virtual BlockingQueueAddResult add(T item) = 0;
  virtual BlockingQueueAddResult addWithPriority(
      T item,
      int8_t /* priority */) {
    return add(std::move(item));
  }
  virtual uint8_t getNumPriorities() {
    return 1;
  }
  virtual T take() = 0;
  virtual folly::Optional<T> try_take_for(std::chrono::milliseconds time) = 0;
  virtual size_t size() = 0;
};

} // namespace folly
