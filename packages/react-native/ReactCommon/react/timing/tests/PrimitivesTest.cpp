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

TEST(HighResDuration, CorrectlyConvertsToDOMHighResTimeStamp) {
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10).toDOMHighResTimeStamp(), 0.00001);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e3).toDOMHighResTimeStamp(), 0.01);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e6).toDOMHighResTimeStamp(), 10.0);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e9).toDOMHighResTimeStamp(),
      10000.0);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(1e9 + 20).toDOMHighResTimeStamp(),
      1000.000020);

  EXPECT_EQ(HighResDuration::fromMilliseconds(0).toDOMHighResTimeStamp(), 0);
  EXPECT_EQ(
      HighResDuration::fromMilliseconds(10).toDOMHighResTimeStamp(), 10.0);
}

TEST(HighResDuration, ComparisonOperators) {
  auto duration1 = HighResDuration::fromNanoseconds(10);
  auto duration2 = HighResDuration::fromNanoseconds(20);
  auto duration3 = HighResDuration::fromNanoseconds(10);

  EXPECT_TRUE(duration1 == duration3);
  EXPECT_FALSE(duration1 == duration2);

  EXPECT_TRUE(duration1 != duration2);
  EXPECT_FALSE(duration1 != duration3);

  EXPECT_TRUE(duration1 < duration2);
  EXPECT_FALSE(duration2 < duration1);
  EXPECT_FALSE(duration1 < duration3);

  EXPECT_TRUE(duration1 <= duration2);
  EXPECT_TRUE(duration1 <= duration3);
  EXPECT_FALSE(duration2 <= duration1);

  EXPECT_TRUE(duration2 > duration1);
  EXPECT_FALSE(duration1 > duration2);
  EXPECT_FALSE(duration1 > duration3);

  EXPECT_TRUE(duration2 >= duration1);
  EXPECT_TRUE(duration1 >= duration3);
  EXPECT_FALSE(duration1 >= duration2);
}

TEST(HighResDuration, ArithmeticOperators) {
  auto duration1 = HighResDuration::fromChrono(std::chrono::nanoseconds(100));
  auto duration2 = HighResDuration::fromChrono(std::chrono::nanoseconds(50));

  EXPECT_EQ(duration1 + duration2, std::chrono::nanoseconds(150));
  EXPECT_EQ(duration1 - duration2, std::chrono::nanoseconds(50));
  EXPECT_EQ(duration2 - duration1, std::chrono::nanoseconds(-50));
}

TEST(HighResTimeStamp, ComparisonOperators) {
  auto now = HighResTimeStamp::now();
  auto later = now + HighResDuration::fromNanoseconds(1);
  auto nowCopy = now;

  EXPECT_TRUE(now == nowCopy);
  EXPECT_FALSE(now == later);

  EXPECT_TRUE(now != later);
  EXPECT_FALSE(now != nowCopy);

  EXPECT_TRUE(now < later);
  EXPECT_FALSE(later < now);
  EXPECT_FALSE(now < nowCopy);

  EXPECT_TRUE(now <= later);
  EXPECT_TRUE(now <= nowCopy);
  EXPECT_FALSE(later <= now);

  EXPECT_TRUE(later > now);
  EXPECT_FALSE(now > later);
  EXPECT_FALSE(now > nowCopy);

  EXPECT_TRUE(later >= now);
  EXPECT_TRUE(now >= nowCopy);
  EXPECT_FALSE(now >= later);
}

TEST(HighResTimeStamp, SteadyClockTimePointConversion) {
  [[maybe_unused]] auto timestamp =
      HighResTimeStamp::now().toChronoSteadyClockTimePoint();

  EXPECT_TRUE(decltype(timestamp)::clock::is_steady);
}

} // namespace facebook::react
