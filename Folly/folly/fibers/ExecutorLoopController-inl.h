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

namespace folly {
namespace fibers {

inline ExecutorLoopController::ExecutorLoopController(folly::Executor* executor)
    : executor_(executor) {}

inline ExecutorLoopController::~ExecutorLoopController() {}

inline void ExecutorLoopController::setFiberManager(fibers::FiberManager* fm) {
  fm_ = fm;
}

inline void ExecutorLoopController::schedule() {
  // add() is thread-safe, so this isn't properly optimized for addTask()
  if (!executorKeepAlive_) {
    executorKeepAlive_ = getKeepAliveToken(executor_);
  }
  executor_->add([this]() { return runLoop(); });
}

inline void ExecutorLoopController::runLoop() {
  if (!executorKeepAlive_) {
    if (!fm_->hasTasks()) {
      return;
    }
    executorKeepAlive_ = getKeepAliveToken(executor_);
  }
  fm_->loopUntilNoReadyImpl();
  if (!fm_->hasTasks()) {
    executorKeepAlive_.reset();
  }
}

inline void ExecutorLoopController::scheduleThreadSafe() {
  executor_->add(
      [this, executorKeepAlive = getKeepAliveToken(executor_)]() mutable {
        if (fm_->shouldRunLoopRemote()) {
          return runLoop();
        }
      });
}

inline void ExecutorLoopController::timedSchedule(
    std::function<void()>,
    TimePoint) {
  throw std::logic_error("Time schedule isn't supported by asyncio executor");
}

} // namespace fibers
} // namespace folly
