/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/ClockGettimeWrappers.h>

#include <chrono>

#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

static constexpr auto kAcceptableDeltaSecs = std::chrono::seconds(120);

using folly::test::AreWithinSecs;

#ifdef CLOCK_REALTIME

TEST(ClockGettimeWrappers, clockGettimeWrapperIsWithin120SecsOfSystemClock) {
  struct timespec ts;
  auto ret = folly::chrono::clock_gettime(CLOCK_REALTIME, &ts);
  ASSERT_EQ(0, ret);

  auto gettimeResult =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);
  auto stdChronoSystemClockNow =
      std::chrono::system_clock::now().time_since_epoch();
  ASSERT_TRUE(AreWithinSecs(
      gettimeResult, stdChronoSystemClockNow, kAcceptableDeltaSecs));
}

TEST(ClockGettimeWrappers, clockGettimeNsWrapperIsWithin120SecsOfSystemClock) {
  auto now_ns = folly::chrono::clock_gettime_ns(CLOCK_REALTIME);
  auto stdChronoSystemClockNow =
      std::chrono::system_clock::now().time_since_epoch();
  ASSERT_TRUE(AreWithinSecs(
      std::chrono::nanoseconds(now_ns),
      stdChronoSystemClockNow,
      kAcceptableDeltaSecs));
}

#endif /* CLOCK_REALTIME */
