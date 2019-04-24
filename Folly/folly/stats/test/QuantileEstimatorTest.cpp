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

#include <folly/stats/QuantileEstimator-defs.h>

#include <folly/portability/GTest.h>

using namespace folly;

struct MockClock {
 public:
  using duration = std::chrono::steady_clock::duration;
  using time_point = std::chrono::steady_clock::time_point;
  static constexpr auto is_steady = true;

  static time_point now() {
    return Now;
  }

  static time_point Now;
};

MockClock::time_point MockClock::Now = MockClock::time_point{};

TEST(SimpleQuantileEstimatorTest, EstimateQuantiles) {
  SimpleQuantileEstimator<MockClock> estimator;
  for (size_t i = 1; i <= 100; ++i) {
    estimator.addValue(i);
  }

  MockClock::Now += std::chrono::seconds{1};

  auto estimates = estimator.estimateQuantiles(
      std::array<double, 5>{{.001, .01, .5, .99, .999}});

  EXPECT_EQ(5050, estimates.sum);
  EXPECT_EQ(100, estimates.count);

  EXPECT_EQ(0.001, estimates.quantiles[0].first);
  EXPECT_EQ(0.01, estimates.quantiles[1].first);
  EXPECT_EQ(0.5, estimates.quantiles[2].first);
  EXPECT_EQ(0.99, estimates.quantiles[3].first);
  EXPECT_EQ(0.999, estimates.quantiles[4].first);

  EXPECT_EQ(1, estimates.quantiles[0].second);
  EXPECT_EQ(2.0 - 0.5, estimates.quantiles[1].second);
  EXPECT_EQ(50.375, estimates.quantiles[2].second);
  EXPECT_EQ(100.0 - 0.5, estimates.quantiles[3].second);
  EXPECT_EQ(100, estimates.quantiles[4].second);
}

TEST(SlidingWindowQuantileEstimatorTest, EstimateQuantiles) {
  SlidingWindowQuantileEstimator<MockClock> estimator(std::chrono::seconds{1});
  for (size_t i = 1; i <= 100; ++i) {
    estimator.addValue(i);
  }

  MockClock::Now += std::chrono::seconds{1};

  auto estimates = estimator.estimateQuantiles(
      std::array<double, 5>{{.001, .01, .5, .99, .999}});

  EXPECT_EQ(5050, estimates.sum);
  EXPECT_EQ(100, estimates.count);

  EXPECT_EQ(0.001, estimates.quantiles[0].first);
  EXPECT_EQ(0.01, estimates.quantiles[1].first);
  EXPECT_EQ(0.5, estimates.quantiles[2].first);
  EXPECT_EQ(0.99, estimates.quantiles[3].first);
  EXPECT_EQ(0.999, estimates.quantiles[4].first);

  EXPECT_EQ(1, estimates.quantiles[0].second);
  EXPECT_EQ(2.0 - 0.5, estimates.quantiles[1].second);
  EXPECT_EQ(50.375, estimates.quantiles[2].second);
  EXPECT_EQ(100.0 - 0.5, estimates.quantiles[3].second);
  EXPECT_EQ(100, estimates.quantiles[4].second);
}
