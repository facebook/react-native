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

#include <future>

#include <glog/logging.h>

#include <folly/Executor.h>
#include <folly/synchronization/Baton.h>

namespace folly {

/// An Executor accepts units of work with add(), which should be
/// threadsafe.
class DefaultKeepAliveExecutor : public virtual Executor {
 public:
  DefaultKeepAliveExecutor() : Executor() {}

  virtual ~DefaultKeepAliveExecutor() {
    DCHECK(!keepAlive_);
  }

  folly::Executor::KeepAlive<> weakRef() {
    return WeakRef::create(controlBlock_, this);
  }

 protected:
  void joinKeepAlive() {
    DCHECK(keepAlive_);
    keepAlive_.reset();
    keepAliveReleaseBaton_.wait();
  }

 private:
  struct ControlBlock {
    std::atomic<ssize_t> keepAliveCount_{1};
  };

  class WeakRef : public Executor {
   public:
    static folly::Executor::KeepAlive<> create(
        std::shared_ptr<ControlBlock> controlBlock,
        Executor* executor) {
      return makeKeepAlive(new WeakRef(std::move(controlBlock), executor));
    }

    void add(Func f) override {
      if (auto executor = lock()) {
        executor->add(std::move(f));
      }
    }

    void addWithPriority(Func f, int8_t priority) override {
      if (auto executor = lock()) {
        executor->addWithPriority(std::move(f), priority);
      }
    }

    virtual uint8_t getNumPriorities() const override {
      return numPriorities_;
    }

   private:
    WeakRef(std::shared_ptr<ControlBlock> controlBlock, Executor* executor)
        : controlBlock_(std::move(controlBlock)),
          executor_(executor),
          numPriorities_(executor->getNumPriorities()) {}

    bool keepAliveAcquire() override {
      auto keepAliveCount =
          keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
      // We should never increment from 0
      DCHECK(keepAliveCount > 0);
      return true;
    }

    void keepAliveRelease() override {
      auto keepAliveCount =
          keepAliveCount_.fetch_sub(1, std::memory_order_acq_rel);
      DCHECK(keepAliveCount >= 1);

      if (keepAliveCount == 1) {
        delete this;
      }
    }

    folly::Executor::KeepAlive<> lock() {
      auto controlBlock =
          controlBlock_->keepAliveCount_.load(std::memory_order_relaxed);
      do {
        if (controlBlock == 0) {
          return {};
        }
      } while (!controlBlock_->keepAliveCount_.compare_exchange_weak(
          controlBlock,
          controlBlock + 1,
          std::memory_order_release,
          std::memory_order_relaxed));

      return makeKeepAlive(executor_);
    }

    std::atomic<size_t> keepAliveCount_{1};

    std::shared_ptr<ControlBlock> controlBlock_;
    Executor* executor_;

    uint8_t numPriorities_;
  };

  bool keepAliveAcquire() override {
    auto keepAliveCount =
        controlBlock_->keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
    // We should never increment from 0
    DCHECK(keepAliveCount > 0);
    return true;
  }

  void keepAliveRelease() override {
    auto keepAliveCount =
        controlBlock_->keepAliveCount_.fetch_sub(1, std::memory_order_acquire);
    DCHECK(keepAliveCount >= 1);

    if (keepAliveCount == 1) {
      keepAliveReleaseBaton_.post(); // std::memory_order_release
    }
  }

  std::shared_ptr<ControlBlock> controlBlock_{std::make_shared<ControlBlock>()};
  Baton<> keepAliveReleaseBaton_;
  KeepAlive<DefaultKeepAliveExecutor> keepAlive_{
      makeKeepAlive<DefaultKeepAliveExecutor>(this)};
};

} // namespace folly
