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

#include <folly/portability/Time.h>

#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

#include <chrono>

static constexpr auto kAcceptableDeltaSecs = std::chrono::seconds(120);

using folly::test::AreWithinSecs;

#ifdef CLOCK_REALTIME

TEST(Time, clockGettimeRealtimeAreWithin120SecsOfStdChronoSystemClock) {
  struct timespec ts;
  auto ret = clock_gettime(CLOCK_REALTIME, &ts);
  ASSERT_EQ(0, ret);

  auto gettimeResult =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);
  auto stdChronoSystemClockNow =
      std::chrono::system_clock::now().time_since_epoch();
  ASSERT_TRUE(AreWithinSecs(
      gettimeResult, stdChronoSystemClockNow, kAcceptableDeltaSecs));
}

#endif /* CLOCK_REALTIME */

#ifdef CLOCK_MONOTONIC

TEST(Time, clockGettimeMonotonicAreWithin120SecsOfStdChronoSteadyClock) {
  struct timespec ts;
  auto ret = clock_gettime(CLOCK_MONOTONIC, &ts);
  ASSERT_EQ(0, ret);

  auto gettimeResult =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);
  auto stdChronoSteadyClockNow =
      std::chrono::steady_clock::now().time_since_epoch();
  ASSERT_TRUE(AreWithinSecs(
      gettimeResult, stdChronoSteadyClockNow, kAcceptableDeltaSecs));
}

#endif /* CLOCK_MONOTONIC */

#ifdef CLOCK_PROCESS_CPUTIME_ID

TEST(Time, clockGettimeProcessCputimeIsGreaterThanZero) {
  struct timespec ts;
  auto ret = clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &ts);
  ASSERT_EQ(0, ret);

  auto gettimeResult =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);

  ASSERT_GT(gettimeResult, std::chrono::nanoseconds::zero());
}

#endif /* CLOCK_PROCESS_CPUTIME_ID */

#ifdef CLOCK_THREAD_CPUTIME_ID

TEST(Time, clockGettimeProcessThreadTimeIsGreaterThanZero) {
  struct timespec ts;
  auto ret = clock_gettime(CLOCK_THREAD_CPUTIME_ID, &ts);
  ASSERT_EQ(0, ret);

  auto gettimeResult =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);

  ASSERT_GT(gettimeResult, std::chrono::nanoseconds::zero());
}

#endif /* CLOCK_THREAD_CPUTIME_ID */
