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

#include <folly/stats/TDigest.h>
#include <folly/stats/detail/BufferedStat.h>

namespace folly {

struct QuantileEstimates {
 public:
  double sum;
  double count;

  // vector of {quantile, value}
  std::vector<std::pair<double, double>> quantiles;
};

/*
 * A QuantileEstimator that buffers writes for 1 second.
 */
template <typename ClockT = std::chrono::steady_clock>
class SimpleQuantileEstimator {
 public:
  using TimePoint = typename ClockT::time_point;

  SimpleQuantileEstimator();

  QuantileEstimates estimateQuantiles(
      Range<const double*> quantiles,
      TimePoint now = ClockT::now());

  void addValue(double value, TimePoint now = ClockT::now());

  /// Flush buffered values
  void flush() {
    bufferedDigest_.flush();
  }

 private:
  detail::BufferedDigest<TDigest, ClockT> bufferedDigest_;
};

/*
 * A QuantileEstimator that keeps values for nWindows * windowDuration (see
 * constructor). Values are buffered for windowDuration.
 */
template <typename ClockT = std::chrono::steady_clock>
class SlidingWindowQuantileEstimator {
 public:
  using TimePoint = typename ClockT::time_point;

  SlidingWindowQuantileEstimator(
      std::chrono::seconds windowDuration,
      size_t nWindows = 60);

  QuantileEstimates estimateQuantiles(
      Range<const double*> quantiles,
      TimePoint now = ClockT::now());

  void addValue(double value, TimePoint now = ClockT::now());

  /// Flush buffered values
  void flush() {
    bufferedSlidingWindow_.flush();
  }

 private:
  detail::BufferedSlidingWindow<TDigest, ClockT> bufferedSlidingWindow_;
};

extern template class SimpleQuantileEstimator<std::chrono::steady_clock>;
extern template class SlidingWindowQuantileEstimator<std::chrono::steady_clock>;

} // namespace folly
