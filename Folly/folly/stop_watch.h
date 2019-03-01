/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/portability/Time.h>
#include <chrono>
#include <stdexcept>
#include <utility>

namespace folly {

#ifdef CLOCK_MONOTONIC_COARSE
struct monotonic_coarse_clock {
  typedef std::chrono::milliseconds::rep rep;
  typedef std::chrono::milliseconds::period period;
  typedef std::chrono::milliseconds duration;
  typedef std::chrono::time_point<monotonic_coarse_clock> time_point;
  constexpr static bool is_steady = true;

  static time_point now() {
    timespec ts;
    auto ret = clock_gettime(CLOCK_MONOTONIC_COARSE, &ts);
    if (ret != 0) {
      throw std::runtime_error("Error using CLOCK_MONOTONIC_COARSE.");
    }
    return time_point(
        duration((ts.tv_sec * 1000) + ((ts.tv_nsec / 1000) / 1000)));
  }
};
#else
using monotonic_coarse_clock = std::chrono::steady_clock;
#endif

using monotonic_clock = std::chrono::steady_clock;

/**
 * Calculates the duration of time intervals. Prefer this over directly using
 * monotonic clocks. It is very lightweight and provides convenient facilitles
 * to avoid common pitfalls.
 *
 * There are two type aliases that should be preferred over instantiating this
 * class directly: `coarse_stop_watch` and `stop_watch`.
 *
 * Arguments:
 *  - Clock: the monotonic clock to use when calculating time intervals
 *  - Duration: (optional) the duration to use when reporting elapsed time.
 *              Defaults to the clock's duration.
 *
 * Example 1:
 *
 *  coarse_stop_watch<std::seconds> watch;
 *  do_something();
 *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
 *
 *  auto const ttl = 60_s;
 *  if (watch.elapsed(ttl)) {
 *    process_expiration();
 *  }
 *
 * Example 2:
 *
 *  struct run_every_n_seconds {
 *    using callback = std::function<void()>;
 *    run_every_n_seconds(std::chrono::seconds period, callback action)
 *      period_(period),
 *      action_(std::move(action))
 *    {
 *      // watch_ is correctly initialized to the current time
 *    }
 *
 *    void run() {
 *      while (true) {
 *        if (watch_.lap(period_)) {
 *          action_();
 *        }
 *        std::this_thread::yield();
 *      }
 *    }
 *
 *  private:
 *    stop_watch<> watch_;
 *    std::chrono::seconds period_;
 *    callback action_;
 *  };
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
template <typename Clock, typename Duration = typename Clock::duration>
struct custom_stop_watch {
  using clock_type = Clock;
  using duration = Duration;
  using time_point = std::chrono::time_point<clock_type, duration>;

  static_assert(
      std::ratio_less_equal<
          typename clock_type::duration::period,
          typename duration::period>::value,
      "clock must be at least as precise as the requested duration");

  static_assert(
      Clock::is_steady,
      "only monotonic clocks should be used to track time intervals");

  /**
   * Initializes the stop watch with the current time as its checkpoint.
   *
   * Example:
   *
   *  stop_watch<> watch;
   *  do_something();
   *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  custom_stop_watch() : checkpoint_(clock_type::now()) {}

  /**
   * Initializes the stop watch with the given time as its checkpoint.
   *
   * NOTE: this constructor should be seldomly used. It is only provided so
   * that, in the rare occasions it is needed, one does not have to reimplement
   * the `custom_stop_watch` class.
   *
   * Example:
   *
   *  custom_stop_watch<monotonic_clock> watch(monotonic_clock::now());
   *  do_something();
   *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  explicit custom_stop_watch(typename clock_type::time_point checkpoint)
      : checkpoint_(std::move(checkpoint)) {}

  /**
   * Updates the stop watch checkpoint to the current time.
   *
   * Example:
   *
   *  struct some_resource {
   *    // ...
   *
   *    void on_reloaded() {
   *      time_alive.reset();
   *    }
   *
   *    void report() {
   *      std::cout << "resource has been alive for " << time_alive.elapsed();
   *    }
   *
   *  private:
   *    stop_watch<> time_alive;
   *  };
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  void reset() {
    checkpoint_ = clock_type::now();
  }

  /**
   * Tells the elapsed time since the last update.
   *
   * The stop watch's checkpoint remains unchanged.
   *
   * Example:
   *
   *  stop_watch<> watch;
   *  do_something();
   *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  duration elapsed() const {
    return std::chrono::duration_cast<duration>(
        clock_type::now() - checkpoint_);
  }

  /**
   * Tells whether the given duration has already elapsed since the last
   * checkpoint.
   *
   * Example:
   *
   *  auto const ttl = 60_s;
   *  stop_watch<> watch;
   *
   *  do_something();
   *
   *  std::cout << "has the TTL expired? " std::boolalpha<< watch.elapsed(ttl);
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  template <typename UDuration>
  bool elapsed(UDuration&& amount) const {
    return clock_type::now() - checkpoint_ >= amount;
  }

  /**
   * Tells the elapsed time since the last update, and updates the checkpoint
   * to the current time.
   *
   * Example:
   *
   *  struct some_resource {
   *    // ...
   *
   *    void on_reloaded() {
   *      auto const alive = time_alive.lap();
   *      std::cout << "resource reloaded after being alive for " << alive;
   *    }
   *
   *  private:
   *    stop_watch<> time_alive;
   *  };
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  duration lap() {
    auto lastCheckpoint = checkpoint_;

    checkpoint_ = clock_type::now();

    return std::chrono::duration_cast<duration>(checkpoint_ - lastCheckpoint);
  }

  /**
   * Tells whether the given duration has already elapsed since the last
   * checkpoint. If so, update the checkpoint to the current time. If not,
   * the checkpoint remains unchanged.
   *
   * Example:
   *
   *  void run_every_n_seconds(
   *    std::chrono::seconds period,
   *    std::function<void()> action
   *  ) {
   *    for (stop_watch<> watch;; ) {
   *      if (watch.lap(period)) {
   *        action();
   *      }
   *      std::this_thread::yield();
   *    }
   *  }
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  template <typename UDuration>
  bool lap(UDuration&& amount) {
    auto now = clock_type::now();

    if (now - checkpoint_ < amount) {
      return false;
    }

    checkpoint_ = now;
    return true;
  }

  /**
   * Returns the current checkpoint
   */
  typename clock_type::time_point getCheckpoint() const {
    return checkpoint_;
  }

 private:
  typename clock_type::time_point checkpoint_;
};

/**
 * A type alias for `custom_stop_watch` that uses a coarse monotonic clock as
 * the time source.  Refer to the documentation of `custom_stop_watch` for full
 * documentation.
 *
 * Arguments:
 *  - Duration: (optional) the duration to use when reporting elapsed time.
 *              Defaults to the clock's duration.
 *
 * Example:
 *
 *  coarse_stop_watch<std::seconds> watch;
 *  do_something();
 *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
template <typename Duration = monotonic_coarse_clock::duration>
using coarse_stop_watch = custom_stop_watch<monotonic_coarse_clock, Duration>;

/**
 * A type alias for `custom_stop_watch` that uses a monotonic clock as the time
 * source.  Refer to the documentation of `custom_stop_watch` for full
 * documentation.
 *
 * Arguments:
 *  - Duration: (optional) the duration to use when reporting elapsed time.
 *              Defaults to the clock's duration.
 *
 * Example:
 *
 *  stop_watch<std::seconds> watch;
 *  do_something();
 *  std::cout << "time elapsed: " << watch.elapsed() << std::endl;
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
template <typename Duration = monotonic_clock::duration>
using stop_watch = custom_stop_watch<monotonic_clock, Duration>;
}
