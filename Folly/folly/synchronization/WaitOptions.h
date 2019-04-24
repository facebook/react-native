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

#include <folly/CPortability.h>

namespace folly {

/// WaitOptions
///
/// Various synchronization primitives as well as various concurrent data
/// structures built using them have operations which might wait. This type
/// represents a set of options for controlling such waiting.
class WaitOptions {
 public:
  struct Defaults {
    /// spin_max
    ///
    /// If multiple threads are actively using a synchronization primitive,
    /// whether indirectly via a higher-level concurrent data structure or
    /// directly, where the synchronization primitive has an operation which
    /// waits and another operation which wakes the waiter, it is common for
    /// wait and wake events to happen almost at the same time. In this state,
    /// we lose big 50% of the time if the wait blocks immediately.
    ///
    /// We can improve our chances of being waked immediately, before blocking,
    /// by spinning for a short duration, although we have to balance this
    /// against the extra cpu utilization, latency reduction, power consumption,
    /// and priority inversion effect if we end up blocking anyway.
    ///
    /// We use a default maximum of 2 usec of spinning. As partial consolation,
    /// since spinning as implemented in folly uses the pause instruction where
    /// available, we give a small speed boost to the colocated hyperthread.
    ///
    /// On circa-2013 devbox hardware, it costs about 7 usec to FUTEX_WAIT and
    /// then be awoken. Spins on this hw take about 7 nsec, where all but 0.5
    /// nsec is the pause instruction.
    static constexpr std::chrono::nanoseconds spin_max =
        std::chrono::microseconds(2);
  };

  std::chrono::nanoseconds spin_max() const {
    return spin_max_;
  }
  WaitOptions& spin_max(std::chrono::nanoseconds dur) {
    spin_max_ = dur;
    return *this;
  }

 private:
  std::chrono::nanoseconds spin_max_ = Defaults::spin_max;
};

} // namespace folly
