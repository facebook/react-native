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
#include <cstdint>

#include <folly/Function.h>

namespace folly {

class AsyncTimeout;

/**
 * Base interface to be implemented by all classes expecting to manage
 * timeouts. AsyncTimeout will use implementations of this interface
 * to schedule/cancel timeouts.
 */
class TimeoutManager {
 public:
  typedef std::chrono::milliseconds timeout_type;
  using Func = folly::Function<void()>;

  enum class InternalEnum { INTERNAL, NORMAL };

  TimeoutManager();

  virtual ~TimeoutManager();

  /**
   * Attaches/detaches TimeoutManager to AsyncTimeout
   */
  virtual void attachTimeoutManager(
      AsyncTimeout* obj,
      InternalEnum internal) = 0;
  virtual void detachTimeoutManager(AsyncTimeout* obj) = 0;

  /**
   * Schedules AsyncTimeout to fire after `timeout` milliseconds
   */
  virtual bool scheduleTimeout(AsyncTimeout* obj, timeout_type timeout) = 0;

  /**
   * Cancels the AsyncTimeout, if scheduled
   */
  virtual void cancelTimeout(AsyncTimeout* obj) = 0;

  /**
   * This is used to mark the beginning of a new loop cycle by the
   * first handler fired within that cycle.
   */
  virtual void bumpHandlingTime() = 0;

  /**
   * Helper method to know whether we are running in the timeout manager
   * thread
   */
  virtual bool isInTimeoutManagerThread() = 0;

  /**
   * Runs the given Cob at some time after the specified number of
   * milliseconds.  (No guarantees exactly when.)
   *
   * Throws a std::system_error if an error occurs.
   */
  void runAfterDelay(
      Func cob,
      uint32_t milliseconds,
      InternalEnum internal = InternalEnum::NORMAL);

  /**
   * @see tryRunAfterDelay for more details
   *
   * @return  true iff the cob was successfully registered.
   */
  bool tryRunAfterDelay(
      Func cob,
      uint32_t milliseconds,
      InternalEnum internal = InternalEnum::NORMAL);

 protected:
  void clearCobTimeouts();

 private:
  struct CobTimeouts;
  std::unique_ptr<CobTimeouts> cobTimeouts_;
};

} // namespace folly
