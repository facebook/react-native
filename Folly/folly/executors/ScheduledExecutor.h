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
#include <memory>
#include <stdexcept>

#include <folly/Executor.h>
#include <folly/lang/Exception.h>

namespace folly {
// An executor that supports timed scheduling. Like RxScheduler.
class ScheduledExecutor : public virtual Executor {
 public:
  // Reality is that better than millisecond resolution is very hard to
  // achieve. However, we reserve the right to be incredible.
  typedef std::chrono::microseconds Duration;
  typedef std::chrono::steady_clock::time_point TimePoint;

  ~ScheduledExecutor() override = default;

  void add(Func) override = 0;

  /// Alias for add() (for Rx consistency)
  void schedule(Func&& a) {
    add(std::move(a));
  }

  /// Schedule a Func to be executed after dur time has elapsed
  /// Expect millisecond resolution at best.
  void schedule(Func&& a, Duration const& dur) {
    scheduleAt(std::move(a), now() + dur);
  }

  /// Schedule a Func to be executed at time t, or as soon afterward as
  /// possible. Expect millisecond resolution at best. Must be threadsafe.
  virtual void scheduleAt(Func&& /* a */, TimePoint const& /* t */) {
    throw_exception<std::logic_error>("unimplemented");
  }

  /// Get this executor's notion of time. Must be threadsafe.
  virtual TimePoint now() {
    return std::chrono::steady_clock::now();
  }
};
} // namespace folly
