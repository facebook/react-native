/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/Function.h>
#include <folly/Likely.h>

#include <folly/fibers/FiberManager.h>
#include <folly/fibers/LoopController.h>

namespace folly {
namespace fibers {

class FiberManager;

class SimpleLoopController : public LoopController {
 public:
  SimpleLoopController() : fm_(nullptr), stopRequested_(false) {}

  ~SimpleLoopController() {
    scheduled_ = false;
  }

  void setTimeFunc(Function<TimePoint()> timeFunc) {
    timeFunc_ = std::move(timeFunc);
  }

  /**
   * Run FiberManager loop; if no ready task are present,
   * run provided function. Stops after both stop() has been called
   * and no waiting tasks remain.
   */
  template <typename F>
  void loop(F&& func) {
    bool waiting = false;
    stopRequested_ = false;

    while (LIKELY(waiting || !stopRequested_)) {
      func();

      auto time = timeFunc_();

      for (size_t i = 0; i < scheduledFuncs_.size(); ++i) {
        if (scheduledFuncs_[i].first <= time) {
          scheduledFuncs_[i].second();
          swap(scheduledFuncs_[i], scheduledFuncs_.back());
          scheduledFuncs_.pop_back();
          --i;
        }
      }

      if (scheduled_) {
        scheduled_ = false;
        runLoop();
        waiting = fm_->hasTasks();
      }
    }
  }

  /**
   * Requests exit from loop() as soon as all waiting tasks complete.
   */
  void stop() {
    stopRequested_ = true;
  }

  int remoteScheduleCalled() const {
    return remoteScheduleCalled_;
  }

  void runLoop() override {
    do {
      if (remoteLoopRun_ < remoteScheduleCalled_) {
        for (; remoteLoopRun_ < remoteScheduleCalled_; ++remoteLoopRun_) {
          if (fm_->shouldRunLoopRemote()) {
            fm_->loopUntilNoReadyImpl();
          }
        }
      } else {
        fm_->loopUntilNoReadyImpl();
      }
    } while (remoteLoopRun_ < remoteScheduleCalled_);
  }

  void schedule() override {
    scheduled_ = true;
  }

  void timedSchedule(std::function<void()> func, TimePoint time) override {
    scheduledFuncs_.emplace_back(time, std::move(func));
  }

 private:
  FiberManager* fm_;
  std::atomic<bool> scheduled_{false};
  bool stopRequested_;
  std::atomic<int> remoteScheduleCalled_{0};
  int remoteLoopRun_{0};
  std::vector<std::pair<TimePoint, std::function<void()>>> scheduledFuncs_;
  Function<TimePoint()> timeFunc_{[] { return Clock::now(); }};

  /* LoopController interface */

  void setFiberManager(FiberManager* fm) override {
    fm_ = fm;
  }

  void scheduleThreadSafe() override {
    ++remoteScheduleCalled_;
    scheduled_ = true;
  }

  friend class FiberManager;
};
} // namespace fibers
} // namespace folly
