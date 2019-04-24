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

namespace folly {
namespace fibers {

class FiberManager;

class LoopController {
 public:
  typedef std::chrono::steady_clock Clock;
  typedef std::chrono::time_point<Clock> TimePoint;

  virtual ~LoopController() {}

  /**
   * Called by FiberManager to associate itself with the LoopController.
   */
  virtual void setFiberManager(FiberManager*) = 0;

  /**
   * Called by FiberManager to schedule the loop function run
   * at some point in the futufre.
   */
  virtual void schedule() = 0;

  /**
   * Run FiberManager loopUntilNoReadyImpl(). May have additional logic specific
   * to a LoopController.
   */
  virtual void runLoop() = 0;

  /**
   * Same as schedule(), but safe to call from any thread.
   */
  virtual void scheduleThreadSafe() = 0;

  /**
   * Called by FiberManager to schedule some function to be run at some time.
   */
  virtual void timedSchedule(std::function<void()> func, TimePoint time) = 0;
};
} // namespace fibers
} // namespace folly
