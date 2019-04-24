/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/DefaultKeepAliveExecutor.h>

namespace folly {

/**
 * VirtualExecutor implements a light-weight view onto existing Executor.
 *
 * Multiple VirtualExecutors can be backed by a single Executor.
 *
 * VirtualExecutor's destructor blocks until all tasks scheduled through it are
 * complete. Executor's destructor also blocks until all VirtualExecutors
 * backed by it are released.
 */
class VirtualExecutor : public DefaultKeepAliveExecutor {
  auto wrapFunc(Func f) {
    class FuncAndKeepAlive {
     public:
      FuncAndKeepAlive(Func&& f, VirtualExecutor* executor)
          : keepAlive_(getKeepAliveToken(executor)), f_(std::move(f)) {}

      void operator()() {
        f_();
      }

     private:
      Executor::KeepAlive<VirtualExecutor> keepAlive_;
      Func f_;
    };

    return FuncAndKeepAlive(std::move(f), this);
  }

 public:
  explicit VirtualExecutor(KeepAlive<> executor)
      : executor_(std::move(executor)) {
    assert(!isKeepAliveDummy(executor_));
  }

  explicit VirtualExecutor(Executor* executor)
      : VirtualExecutor(getKeepAliveToken(executor)) {}

  explicit VirtualExecutor(Executor& executor)
      : VirtualExecutor(getKeepAliveToken(executor)) {}

  VirtualExecutor(const VirtualExecutor&) = delete;
  VirtualExecutor& operator=(const VirtualExecutor&) = delete;

  uint8_t getNumPriorities() const override {
    return executor_->getNumPriorities();
  }

  void add(Func f) override {
    executor_->add(wrapFunc(std::move(f)));
  }

  void addWithPriority(Func f, int8_t priority) override {
    executor_->addWithPriority(wrapFunc(std::move(f)), priority);
  }

  ~VirtualExecutor() override {
    joinKeepAlive();
  }

 private:
  const KeepAlive<> executor_;
};

} // namespace folly
