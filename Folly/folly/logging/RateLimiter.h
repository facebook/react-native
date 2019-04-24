/*
 * Copyright 2017-present Facebook, Inc.
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
#include <chrono>
#include <cstdint>

#include <folly/Chrono.h>

namespace folly {
namespace logging {

/**
 * A rate limiter that can rate limit events to N events per M milliseconds.
 *
 * It is intended to be fast to check when messages are not being rate limited.
 * When messages are being rate limited it is slightly slower, as it has to
 * check the clock each time check() is called in this case.
 */
class IntervalRateLimiter {
 public:
  using clock = chrono::coarse_steady_clock;

  constexpr IntervalRateLimiter(
      uint64_t maxPerInterval,
      clock::duration interval)
      : maxPerInterval_{maxPerInterval}, interval_{interval} {}

  bool check() {
    auto origCount = count_.fetch_add(1, std::memory_order_acq_rel);
    if (origCount < maxPerInterval_) {
      return true;
    }
    return checkSlow();
  }

 private:
  bool checkSlow();

  const uint64_t maxPerInterval_;
  const clock::time_point::duration interval_;

  // Initialize count_ to the maximum possible value so that the first
  // call to check() will call checkSlow() to initialize timestamp_,
  // but subsequent calls will hit the fast-path and avoid checkSlow()
  std::atomic<uint64_t> count_{std::numeric_limits<uint64_t>::max()};
  // Ideally timestamp_ would be a
  // std::atomic<clock::time_point>, but this does not
  // work since time_point's constructor is not noexcept
  std::atomic<clock::rep> timestamp_{0};
};

} // namespace logging
} // namespace folly
