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

#include <folly/Chrono.h>

#include <gtest/gtest.h>

using namespace std::chrono;
using namespace folly::chrono;

namespace {

class ChronoTest : public testing::Test {};
}

TEST_F(ChronoTest, ceil_duration) {
  EXPECT_EQ(seconds(7), ceil<seconds>(seconds(7)));
  EXPECT_EQ(seconds(7), ceil<seconds>(milliseconds(7000)));
  EXPECT_EQ(seconds(7), ceil<seconds>(milliseconds(6200)));
}

TEST_F(ChronoTest, ceil_time_point) {
  auto const point = steady_clock::time_point{};
  EXPECT_EQ(point + seconds(7), ceil<seconds>(point + seconds(7)));
  EXPECT_EQ(point + seconds(7), ceil<seconds>(point + milliseconds(7000)));
  EXPECT_EQ(point + seconds(7), ceil<seconds>(point + milliseconds(6200)));
}

TEST_F(ChronoTest, floor_duration) {
  EXPECT_EQ(seconds(7), floor<seconds>(seconds(7)));
  EXPECT_EQ(seconds(7), floor<seconds>(milliseconds(7000)));
  EXPECT_EQ(seconds(7), floor<seconds>(milliseconds(7800)));
}

TEST_F(ChronoTest, floor_time_point) {
  auto const point = steady_clock::time_point{};
  EXPECT_EQ(point + seconds(7), floor<seconds>(point + seconds(7)));
  EXPECT_EQ(point + seconds(7), floor<seconds>(point + milliseconds(7000)));
  EXPECT_EQ(point + seconds(7), floor<seconds>(point + milliseconds(7800)));
}

TEST_F(ChronoTest, round_duration) {
  EXPECT_EQ(seconds(7), round<seconds>(seconds(7)));
  EXPECT_EQ(seconds(6), round<seconds>(milliseconds(6200)));
  EXPECT_EQ(seconds(6), round<seconds>(milliseconds(6500)));
  EXPECT_EQ(seconds(7), round<seconds>(milliseconds(6800)));
  EXPECT_EQ(seconds(7), round<seconds>(milliseconds(7000)));
  EXPECT_EQ(seconds(7), round<seconds>(milliseconds(7200)));
  EXPECT_EQ(seconds(8), round<seconds>(milliseconds(7500)));
  EXPECT_EQ(seconds(8), round<seconds>(milliseconds(7800)));
}

TEST_F(ChronoTest, round_time_point) {
  auto const point = steady_clock::time_point{};
  EXPECT_EQ(point + seconds(7), round<seconds>(point + seconds(7)));
  EXPECT_EQ(point + seconds(6), round<seconds>(point + milliseconds(6200)));
  EXPECT_EQ(point + seconds(6), round<seconds>(point + milliseconds(6500)));
  EXPECT_EQ(point + seconds(7), round<seconds>(point + milliseconds(6800)));
  EXPECT_EQ(point + seconds(7), round<seconds>(point + milliseconds(7000)));
  EXPECT_EQ(point + seconds(7), round<seconds>(point + milliseconds(7200)));
  EXPECT_EQ(point + seconds(8), round<seconds>(point + milliseconds(7500)));
  EXPECT_EQ(point + seconds(8), round<seconds>(point + milliseconds(7800)));
}
