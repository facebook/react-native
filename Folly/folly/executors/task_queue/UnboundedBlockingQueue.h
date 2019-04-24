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

#include <folly/concurrency/UnboundedQueue.h>
#include <folly/executors/task_queue/BlockingQueue.h>
#include <folly/synchronization/LifoSem.h>

namespace folly {

template <class T>
class UnboundedBlockingQueue : public BlockingQueue<T> {
 public:
  virtual ~UnboundedBlockingQueue() {}

  BlockingQueueAddResult add(T item) override {
    queue_.enqueue(std::move(item));
    return sem_.post();
  }

  T take() override {
    T item;
    while (!queue_.try_dequeue(item)) {
      sem_.wait();
    }
    return item;
  }

  folly::Optional<T> try_take_for(std::chrono::milliseconds time) override {
    T item;
    while (!queue_.try_dequeue(item)) {
      if (!sem_.try_wait_for(time)) {
        return folly::none;
      }
    }
    return std::move(item);
  }

  size_t size() override {
    return queue_.size();
  }

 private:
  LifoSem sem_;
  UMPMCQueue<T, false, 6> queue_;
};

} // namespace folly
