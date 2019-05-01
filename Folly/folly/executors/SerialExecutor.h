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

#include <atomic>
#include <memory>
#include <mutex>

#include <folly/concurrency/UnboundedQueue.h>
#include <folly/executors/GlobalExecutor.h>
#include <folly/executors/SequencedExecutor.h>

namespace folly {

/**
 * @class SerialExecutor
 *
 * @brief Executor that guarantees serial non-concurrent execution of added
 *     tasks
 *
 * SerialExecutor is similar to boost asio's strand concept. A SerialExecutor
 * has a parent executor which is given at construction time (defaults to
 * folly's global CPUExecutor). Tasks added to SerialExecutor are executed
 * in the parent executor, however strictly non-concurrently and in the order
 * they were added.
 *
 * SerialExecutor tries to schedule its tasks fairly. Every task submitted to
 * it results in one task submitted to the parent executor. Whenever the parent
 * executor executes one of those, one of the tasks submitted to SerialExecutor
 * is marked for execution, which means it will either be executed at once,
 * or if a task is currently being executed already, after that.
 *
 * The SerialExecutor may be deleted at any time. All tasks that have been
 * submitted will still be executed with the same guarantees, as long as the
 * parent executor is executing tasks.
 */

class SerialExecutor : public SequencedExecutor {
 public:
  SerialExecutor(SerialExecutor const&) = delete;
  SerialExecutor& operator=(SerialExecutor const&) = delete;
  SerialExecutor(SerialExecutor&&) = delete;
  SerialExecutor& operator=(SerialExecutor&&) = delete;

  static KeepAlive<SerialExecutor> create(
      KeepAlive<Executor> parent = getKeepAliveToken(getCPUExecutor().get()));

  class Deleter {
   public:
    Deleter() {}

    void operator()(SerialExecutor* executor) {
      executor->keepAliveRelease();
    }

   private:
    friend class SerialExecutor;
    explicit Deleter(std::shared_ptr<Executor> parent)
        : parent_(std::move(parent)) {}

    std::shared_ptr<Executor> parent_;
  };

  using UniquePtr = std::unique_ptr<SerialExecutor, Deleter>;
  [[deprecated("Replaced by create")]] static UniquePtr createUnique(
      std::shared_ptr<Executor> parent = getCPUExecutor());

  /**
   * Add one task for execution in the parent executor
   */
  void add(Func func) override;

  /**
   * Add one task for execution in the parent executor, and use the given
   * priority for one task submission to parent executor.
   *
   * Since in-order execution of tasks submitted to SerialExecutor is
   * guaranteed, the priority given here does not necessarily reflect the
   * execution priority of the task submitted with this call to
   * `addWithPriority`. The given priority is passed on to the parent executor
   * for the execution of one of the SerialExecutor's tasks.
   */
  void addWithPriority(Func func, int8_t priority) override;
  uint8_t getNumPriorities() const override {
    return parent_->getNumPriorities();
  }

 protected:
  bool keepAliveAcquire() override;

  void keepAliveRelease() override;

 private:
  explicit SerialExecutor(KeepAlive<Executor> parent);
  ~SerialExecutor() override;

  void run();

  KeepAlive<Executor> parent_;
  std::atomic<std::size_t> scheduled_{0};
  /**
   * Unbounded multi producer single consumer queue where consumers don't block
   * on dequeue.
   */
  folly::UnboundedQueue<Func, false, true, false> queue_;

  std::atomic<ssize_t> keepAliveCounter_{1};
};

} // namespace folly
