/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "../primitives.h"

namespace facebook::react {

using Clock = std::chrono::steady_clock;
using TimePoint = std::chrono::time_point<Clock>;

TEST(chronoToDOMHighResTimeStamp, withDurations) {
  EXPECT_EQ(chronoToDOMHighResTimeStamp(std::chrono::nanoseconds(10)), 0.00001);
  EXPECT_EQ(chronoToDOMHighResTimeStamp(std::chrono::microseconds(10)), 0.01);
  EXPECT_EQ(chronoToDOMHighResTimeStamp(std::chrono::milliseconds(10)), 10.0);
  EXPECT_EQ(chronoToDOMHighResTimeStamp(std::chrono::seconds(10)), 10000.0);
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(
          std::chrono::seconds(1) + std::chrono::nanoseconds(20)),
      1000.000020);
}

TEST(chronoToDOMHighResTimeStamp, withTimePoints) {
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(TimePoint(std::chrono::nanoseconds(10))),
      0.00001);
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(TimePoint(std::chrono::microseconds(10))),
      0.01);
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(TimePoint(std::chrono::milliseconds(10))),
      10.0);
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(TimePoint(std::chrono::seconds(10))),
      10000.0);
  EXPECT_EQ(
      chronoToDOMHighResTimeStamp(
          TimePoint(std::chrono::seconds(1) + std::chrono::nanoseconds(20))),
      1000.000020);
}

} // namespace facebook::react
