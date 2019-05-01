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

#include <memory>

#include <folly/Executor.h>
#include <folly/fibers/FiberManagerInternal.h>
#include <folly/fibers/LoopController.h>

namespace folly {
namespace fibers {

/**
 * A fiber loop controller that works for arbitrary folly::Executor
 */
class ExecutorLoopController : public fibers::LoopController {
 public:
  explicit ExecutorLoopController(folly::Executor* executor);
  ~ExecutorLoopController() override;

 private:
  folly::Executor* executor_;
  Executor::KeepAlive<> executorKeepAlive_;
  fibers::FiberManager* fm_{nullptr};

  void setFiberManager(fibers::FiberManager* fm) override;
  void schedule() override;
  void runLoop() override;
  void scheduleThreadSafe() override;
  void timedSchedule(std::function<void()> func, TimePoint time) override;

  friend class fibers::FiberManager;
};

} // namespace fibers
} // namespace folly

#include <folly/fibers/ExecutorLoopController-inl.h>
