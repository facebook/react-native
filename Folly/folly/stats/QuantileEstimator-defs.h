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

#include <folly/stats/QuantileEstimator.h>

#include <folly/stats/detail/BufferedStat-defs.h>

namespace folly {
namespace detail {

QuantileEstimates estimatesFromDigest(
    const TDigest& digest,
    Range<const double*> quantiles);

} // namespace detail

template <typename ClockT>
SimpleQuantileEstimator<ClockT>::SimpleQuantileEstimator()
    : bufferedDigest_(std::chrono::seconds{1}, 1000, 100) {}

template <typename ClockT>
QuantileEstimates SimpleQuantileEstimator<ClockT>::estimateQuantiles(
    Range<const double*> quantiles,
    TimePoint now) {
  auto digest = bufferedDigest_.get(now);
  return detail::estimatesFromDigest(digest, quantiles);
}

template <typename ClockT>
void SimpleQuantileEstimator<ClockT>::addValue(double value, TimePoint now) {
  bufferedDigest_.append(value, now);
}

template <typename ClockT>
SlidingWindowQuantileEstimator<ClockT>::SlidingWindowQuantileEstimator(
    std::chrono::seconds windowDuration,
    size_t nWindows)
    : bufferedSlidingWindow_(nWindows, windowDuration, 1000, 100) {}

template <typename ClockT>
QuantileEstimates SlidingWindowQuantileEstimator<ClockT>::estimateQuantiles(
    Range<const double*> quantiles,
    TimePoint now) {
  auto digests = bufferedSlidingWindow_.get(now);
  auto digest = TDigest::merge(digests);
  return detail::estimatesFromDigest(digest, quantiles);
}

template <typename ClockT>
void SlidingWindowQuantileEstimator<ClockT>::addValue(
    double value,
    TimePoint now) {
  bufferedSlidingWindow_.append(value, now);
}

} // namespace folly
