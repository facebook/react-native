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

#include <chrono>
#include <functional>
#include <memory>
#include <queue>

#include <boost/intrusive/list.hpp>

#include <folly/Likely.h>

#include <folly/fibers/LoopController.h>

namespace folly {
namespace fibers {

class TimeoutController
    : public std::enable_shared_from_this<TimeoutController> {
 public:
  typedef std::chrono::steady_clock Clock;
  typedef std::chrono::time_point<Clock> TimePoint;
  typedef Clock::duration Duration;

  explicit TimeoutController(LoopController& loopController);

  intptr_t registerTimeout(std::function<void()> f, Duration duration);
  void cancel(intptr_t id);

  void runTimeouts(TimePoint time);

 private:
  void scheduleRun();

  struct TimeoutHandle;
  typedef std::queue<TimeoutHandle> TimeoutHandleList;
  typedef std::unique_ptr<TimeoutHandleList> TimeoutHandleListPtr;

  struct TimeoutHandle {
    TimeoutHandle(
        std::function<void()> func_,
        TimePoint timeout_,
        TimeoutHandleList& list_)
        : func(std::move(func_)), timeout(timeout_), list(list_) {}

    std::function<void()> func;
    bool canceled{false};
    TimePoint timeout;
    TimeoutHandleList& list;
  };

  std::vector<std::pair<Duration, TimeoutHandleListPtr>> timeoutHandleBuckets_;
  TimePoint nextTimeout_;
  LoopController& loopController_;
};
} // namespace fibers
} // namespace folly
