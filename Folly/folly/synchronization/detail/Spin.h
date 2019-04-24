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

#include <algorithm>
#include <chrono>
#include <thread>

#include <folly/portability/Asm.h>
#include <folly/synchronization/WaitOptions.h>

namespace folly {
namespace detail {

enum class spin_result {
  success, // condition passed
  timeout, // exceeded deadline
  advance, // exceeded current wait-options component timeout
};

template <typename Clock, typename Duration, typename F>
spin_result spin_pause_until(
    std::chrono::time_point<Clock, Duration> const& deadline,
    WaitOptions const& opt,
    F f) {
  if (opt.spin_max() <= opt.spin_max().zero()) {
    return spin_result::advance;
  }

  auto tbegin = Clock::now();
  while (true) {
    if (f()) {
      return spin_result::success;
    }

    auto const tnow = Clock::now();
    if (tnow >= deadline) {
      return spin_result::timeout;
    }

    //  Backward time discontinuity in Clock? revise pre_block starting point
    tbegin = std::min(tbegin, tnow);
    if (tnow >= tbegin + opt.spin_max()) {
      return spin_result::advance;
    }

    //  The pause instruction is the polite way to spin, but it doesn't
    //  actually affect correctness to omit it if we don't have it. Pausing
    //  donates the full capabilities of the current core to its other
    //  hyperthreads for a dozen cycles or so.
    asm_volatile_pause();
  }
}

template <typename Clock, typename Duration, typename F>
spin_result spin_yield_until(
    std::chrono::time_point<Clock, Duration> const& deadline,
    F f) {
  while (true) {
    if (f()) {
      return spin_result::success;
    }

    auto const max = std::chrono::time_point<Clock, Duration>::max();
    if (deadline != max && Clock::now() >= deadline) {
      return spin_result::timeout;
    }

    std::this_thread::yield();
  }
}

} // namespace detail
} // namespace folly
