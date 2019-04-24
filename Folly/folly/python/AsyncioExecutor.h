/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/ExceptionString.h>
#include <folly/Function.h>
#include <folly/executors/DrivableExecutor.h>
#include <folly/executors/SequencedExecutor.h>
#include <folly/io/async/NotificationQueue.h>

namespace folly {
namespace python {

class AsyncioExecutor : public DrivableExecutor, public SequencedExecutor {
 public:
  using Func = folly::Func;

  ~AsyncioExecutor() override {
    keepAliveRelease();
    while (keepAliveCounter_ > 0) {
      drive();
    }
  }

  void add(Func func) override {
    queue_.putMessage(std::move(func));
  }

  int fileno() const {
    return consumer_.getFd();
  }

  void drive() noexcept override {
    consumer_.consumeUntilDrained([](Func&& func) {
      try {
        func();
      } catch (...) {
        LOG(ERROR) << "Exception thrown by NotificationQueueExecutor task."
                   << "Exception message: "
                   << folly::exceptionStr(std::current_exception());
      }
    });
  }

 protected:
  bool keepAliveAcquire() override {
    auto keepAliveCounter =
        keepAliveCounter_.fetch_add(1, std::memory_order_relaxed);
    // We should never increment from 0
    DCHECK(keepAliveCounter > 0);
    return true;
  }

  void keepAliveRelease() override {
    auto keepAliveCounter = --keepAliveCounter_;
    DCHECK(keepAliveCounter >= 0);
  }

 private:
  folly::NotificationQueue<Func> queue_;
  folly::NotificationQueue<Func>::SimpleConsumer consumer_{queue_};
  std::atomic<size_t> keepAliveCounter_{1};
}; // AsyncioExecutor

} // namespace python
} // namespace folly
