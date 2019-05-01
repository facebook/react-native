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

#include <chrono>

#include <folly/concurrency/UnboundedQueue.h>
#include <folly/executors/DrivableExecutor.h>

namespace folly {

/*
 * A DrivableExecutor can be driven via its drive() method or its driveUntil()
 * that drives until some time point.
 */
class TimedDrivableExecutor : public DrivableExecutor {
 public:
  ~TimedDrivableExecutor() noexcept {
    // Drain on destruction so that if work is added here during the collapse
    // of a future train, it will propagate.
    drain();
  }

  /// Implements DrivableExecutor
  void drive() noexcept override;

  // Make progress if there is work to do and return true. Otherwise return
  // false.
  bool try_drive() noexcept {
    return try_wait() && run() > 0;
  }

  // Make progress on this Executor's work. Acts as drive, except it will only
  // wait for a period of timeout for work to be enqueued. If no work is
  // enqueued by that point, it will return.
  template <typename Rep, typename Period>
  bool try_drive_for(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return try_wait_for(timeout) && run() > 0;
  }

  // Make progress on this Executor's work. Acts as drive, except it will only
  // wait until deadline for work to be enqueued. If no work is enqueued by
  // that point, it will return.
  template <typename Clock, typename Duration>
  bool try_drive_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return try_wait_until(deadline) && run() > 0;
  }

  void add(Func) override;

  /// Do work. Returns the number of functions that were executed (maybe 0).
  /// Non-blocking, in the sense that we don't wait for work (we can't
  /// control whether one of the functions blocks).
  /// This is stable, it will not chase an ever-increasing tail of work.
  /// This also means, there may be more work available to perform at the
  /// moment that this returns.
  size_t run() noexcept;

  // Do work until there is no more work to do.
  // Returns the number of functions that were executed (maybe 0).
  // Unlike run, this method is not stable. It will chase an infinite tail of
  // work so should be used with care.
  // There will be no work available to perform at the moment that this
  // returns.
  size_t drain() noexcept;

  /// Wait for work to do.
  void wait() noexcept;

  // Return true if there is work to do, false otherwise
  bool try_wait() noexcept {
    return func_ || queue_.try_dequeue(func_);
  }

  /// Wait for work to do or for a period of timeout, whichever is sooner.
  template <typename Rep, typename Period>
  bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return func_ || queue_.try_dequeue_for(func_, timeout);
  }

  /// Wait for work to do or until deadline passes, whichever is sooner.
  template <typename Clock, typename Duration>
  bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return func_ || queue_.try_dequeue_until(func_, deadline);
  }

 private:
  UMPSCQueue<Func, true> queue_;
  Func func_;
};

} // namespace folly
