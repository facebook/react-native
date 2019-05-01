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
#include <folly/chrono/Conv.h>

#include <folly/portability/GTest.h>

using namespace folly;
using namespace std::chrono;
using namespace std::chrono_literals;

namespace {
/**
 * A helper function to create a time_point even if the input duration type has
 * finer resolution than the clock duration type.
 */
template <typename Clock, typename Duration>
typename Clock::time_point createTimePoint(const Duration& d) {
  return typename Clock::time_point(
      std::chrono::duration_cast<typename Clock::duration>(d));
}
} // namespace

TEST(Conv, timespecToStdChrono) {
  struct timespec ts;

  ts.tv_sec = 0;
  ts.tv_nsec = 10;
  EXPECT_EQ(10ns, to<nanoseconds>(ts));
  EXPECT_EQ(0us, to<microseconds>(ts));
  EXPECT_EQ(0ms, to<milliseconds>(ts));
  EXPECT_EQ(0s, to<seconds>(ts));

  ts.tv_sec = 1;
  ts.tv_nsec = 10;
  EXPECT_EQ(1000000010ns, to<nanoseconds>(ts));
  EXPECT_EQ(1000000us, to<microseconds>(ts));
  EXPECT_EQ(1000ms, to<milliseconds>(ts));
  EXPECT_EQ(1s, to<seconds>(ts));
  EXPECT_EQ(
      createTimePoint<system_clock>(1000000010ns),
      to<system_clock::time_point>(ts));
  EXPECT_EQ(
      createTimePoint<steady_clock>(1000000010ns),
      to<steady_clock::time_point>(ts));

  // Test a non-canonical value with tv_nsec larger than 1 second
  ts.tv_sec = 5;
  ts.tv_nsec = 3219876543;
  // Beware about using std::chrono_literals suffixes with very literals:
  // older versions of GCC are buggy and would truncate these to 32-bits.
  EXPECT_EQ(8219876543LL, to<nanoseconds>(ts).count());
  EXPECT_EQ(8219876us, to<microseconds>(ts));
  EXPECT_EQ(8219ms, to<milliseconds>(ts));
  EXPECT_EQ(8s, to<seconds>(ts));
  EXPECT_EQ(
      createTimePoint<system_clock>(nanoseconds(8219876543LL)),
      to<system_clock::time_point>(ts));
  EXPECT_EQ(
      createTimePoint<steady_clock>(nanoseconds(8219876543LL)),
      to<steady_clock::time_point>(ts));

  // Test negative values
  // When going to coarser grained types these should be rounded up towards 0.
  ts.tv_sec = -5;
  ts.tv_nsec = 123456;
  EXPECT_EQ(-4999876544, to<nanoseconds>(ts).count());
  EXPECT_EQ(-4999876544, duration_cast<nanoseconds>(-5s + 123456ns).count());
  EXPECT_EQ(-4999876, to<microseconds>(ts).count());
  EXPECT_EQ(-4999876, duration_cast<microseconds>(-5s + 123456ns).count());
  EXPECT_EQ(-4999, to<milliseconds>(ts).count());
  EXPECT_EQ(-4999, duration_cast<milliseconds>(-5s + 123456ns).count());
  EXPECT_EQ(-4s, to<seconds>(ts));
  EXPECT_EQ(-4, duration_cast<seconds>(-5s + 123456ns).count());
  ts.tv_sec = -7200;
  ts.tv_nsec = 123456;
  EXPECT_EQ(-1h, to<hours>(ts));
  EXPECT_EQ(
      -1,
      duration_cast<hours>(seconds{ts.tv_sec} + nanoseconds{ts.tv_nsec})
          .count());
  ts.tv_sec = -7000;
  ts.tv_nsec = 123456;
  EXPECT_EQ(-1h, to<hours>(ts));
  EXPECT_EQ(
      -1,
      duration_cast<hours>(seconds{ts.tv_sec} + nanoseconds{ts.tv_nsec})
          .count());
  ts.tv_sec = -7201;
  ts.tv_nsec = 123456;
  EXPECT_EQ(-2h, to<hours>(ts));
  EXPECT_EQ(
      -2,
      duration_cast<hours>(seconds{ts.tv_sec} + nanoseconds{ts.tv_nsec})
          .count());

  // Test converions to floating point durations
  ts.tv_sec = 1;
  ts.tv_nsec = 500000000;
  EXPECT_EQ(1.5, to<duration<double>>(ts).count());
  ts.tv_sec = -1;
  ts.tv_nsec = 500000000;
  EXPECT_EQ(-0.5, to<duration<double>>(ts).count());
  ts.tv_sec = -1;
  ts.tv_nsec = -500000000;
  EXPECT_EQ(-1.5, to<duration<double>>(ts).count());
  ts.tv_sec = 1;
  ts.tv_nsec = 500000000;
  auto doubleNanos = to<duration<double, std::nano>>(ts);
  EXPECT_EQ(1500000000, doubleNanos.count());
  ts.tv_sec = 90;
  ts.tv_nsec = 0;
  auto doubleMinutes = to<duration<double, std::ratio<60>>>(ts);
  EXPECT_EQ(1.5, doubleMinutes.count());

  // Test with unusual durations where neither the numerator nor denominator
  // are 1.
  using five_sevenths = std::chrono::duration<int64_t, std::ratio<5, 7>>;
  ts.tv_sec = 1;
  ts.tv_nsec = 0;
  EXPECT_EQ(1, to<five_sevenths>(ts).count());
  ts.tv_sec = 1;
  ts.tv_nsec = 428571500;
  EXPECT_EQ(2, to<five_sevenths>(ts).count());

  using thirteen_thirds = std::chrono::duration<double, std::ratio<13, 3>>;
  ts.tv_sec = 39;
  ts.tv_nsec = 0;
  EXPECT_NEAR(9.0, to<thirteen_thirds>(ts).count(), 0.000000001);
  ts.tv_sec = 1;
  ts.tv_nsec = 0;
  EXPECT_NEAR(0.230769230, to<thirteen_thirds>(ts).count(), 0.000000001);
}

TEST(Conv, timespecToStdChronoOverflow) {
  struct timespec ts;

  // All of our boundary conditions below assume time_t is int64_t.
  // This is true on most modern platforms.
  if (!std::is_same<decltype(ts.tv_sec), int64_t>::value) {
    LOG(INFO) << "skipping most overflow tests: time_t is not int64_t";
  } else {
    // Test the upper boundary of conversion to uint64_t nanoseconds
    using nsec_u64 = std::chrono::duration<uint64_t, std::nano>;
    ts.tv_sec = 18446744073;
    ts.tv_nsec = 709551615;
    EXPECT_EQ(std::numeric_limits<uint64_t>::max(), to<nsec_u64>(ts).count());

    ts.tv_nsec += 1;
    EXPECT_THROW(to<nsec_u64>(ts), std::range_error);

    // Test the lower boundary of conversion to uint64_t nanoseconds
    ts.tv_sec = 0;
    ts.tv_nsec = 0;
    EXPECT_EQ(0, to<nsec_u64>(ts).count());
    ts.tv_sec = -1;
    ts.tv_nsec = 0;
    EXPECT_THROW(to<nsec_u64>(ts), std::range_error);

    // Test the upper boundary of conversion to int64_t microseconds
    using usec_i64 = std::chrono::duration<int64_t, std::micro>;
    ts.tv_sec = 9223372036854LL;
    ts.tv_nsec = 775807000;
    EXPECT_EQ(std::numeric_limits<int64_t>::max(), to<usec_i64>(ts).count());

    ts.tv_nsec += 1;
    EXPECT_THROW(to<usec_i64>(ts), std::range_error);

    // Test the lower boundary of conversion to int64_t microseconds
    ts.tv_sec = -9223372036855LL;
    ts.tv_nsec = 224192000;
    EXPECT_EQ(std::numeric_limits<int64_t>::min(), to<usec_i64>(ts).count());

    ts.tv_nsec -= 1;
    EXPECT_THROW(to<usec_i64>(ts), std::range_error);

    // Test the boundaries of conversion to int32_t seconds
    using sec_i32 = std::chrono::duration<int32_t>;
    ts.tv_sec = 2147483647;
    ts.tv_nsec = 0;
    EXPECT_EQ(std::numeric_limits<int32_t>::max(), to<sec_i32>(ts).count());
    ts.tv_nsec = 1000000000;
    EXPECT_THROW(to<sec_i32>(ts), std::range_error);
    ts.tv_sec = -2147483648;
    ts.tv_nsec = 0;
    EXPECT_EQ(std::numeric_limits<int32_t>::min(), to<sec_i32>(ts).count());
    ts.tv_sec = -2147483649;
    ts.tv_nsec = 999999999;
    EXPECT_THROW(to<sec_i32>(ts), std::range_error);
    ts.tv_sec = -2147483649;
    ts.tv_nsec = 0;
    EXPECT_THROW(to<sec_i32>(ts), std::range_error);
    ts.tv_sec = -2147483650;
    ts.tv_nsec = 0;
    EXPECT_THROW(to<sec_i32>(ts), std::range_error);

    // Test the upper boundary of conversion to uint32_t hours
    using hours_u32 = std::chrono::duration<uint32_t, std::ratio<3600>>;
    ts.tv_sec = 15461882262000LL;
    ts.tv_nsec = 0;
    EXPECT_EQ(std::numeric_limits<uint32_t>::max(), to<hours_u32>(ts).count());
    ts.tv_sec = 15461882265599LL;
    EXPECT_EQ(std::numeric_limits<uint32_t>::max(), to<hours_u32>(ts).count());
    ts.tv_sec = 15461882265600LL;
    EXPECT_THROW(to<hours_u32>(ts), std::range_error);

    using nsec_i64 = std::chrono::duration<int64_t, std::nano>;
    ts.tv_sec = std::numeric_limits<int64_t>::max();
    ts.tv_nsec = std::numeric_limits<int64_t>::max();
    EXPECT_THROW(to<nsec_i64>(ts), std::range_error);

    ts.tv_sec = std::numeric_limits<int64_t>::min();
    ts.tv_nsec = std::numeric_limits<int64_t>::min();
    EXPECT_THROW(to<nsec_i64>(ts), std::range_error);

    // Test some non-normal inputs near the int64_t limit
    ts.tv_sec = 0;
    ts.tv_nsec = std::numeric_limits<int64_t>::min();
    EXPECT_EQ(std::numeric_limits<int64_t>::min(), to<nsec_i64>(ts).count());
    ts.tv_sec = -1;
    ts.tv_nsec = std::numeric_limits<int64_t>::min() + std::nano::den;
    EXPECT_EQ(std::numeric_limits<int64_t>::min(), to<nsec_i64>(ts).count());
    ts.tv_sec = -1;
    ts.tv_nsec = std::numeric_limits<int64_t>::min() + std::nano::den - 1;
    EXPECT_THROW(to<nsec_i64>(ts), std::range_error);

    ts.tv_sec = 0;
    ts.tv_nsec = std::numeric_limits<int64_t>::max();
    EXPECT_EQ(std::numeric_limits<int64_t>::max(), to<nsec_i64>(ts).count());
    ts.tv_sec = 1;
    ts.tv_nsec = std::numeric_limits<int64_t>::max() - std::nano::den;
    EXPECT_EQ(std::numeric_limits<int64_t>::max(), to<nsec_i64>(ts).count());
    ts.tv_sec = 1;
    ts.tv_nsec = std::numeric_limits<int64_t>::max() - std::nano::den + 1;
    EXPECT_THROW(to<nsec_i64>(ts), std::range_error);
  }

  // Theoretically conversion is representable in the output type,
  // but we normalize the input first, and normalization would trigger an
  // overflow.
  using hours_u64 = std::chrono::duration<uint64_t, std::ratio<3600>>;
  ts.tv_sec = std::numeric_limits<decltype(ts.tv_sec)>::max();
  ts.tv_nsec = 1000000000;
  EXPECT_THROW(to<hours_u64>(ts), std::range_error);
  // If we drop it back down to the normal range it should succeed
  ts.tv_nsec = 999999999;
  EXPECT_EQ(
      std::numeric_limits<decltype(ts.tv_sec)>::max() / 3600,
      to<hours_u64>(ts).count());

  // Test overflow with an unusual duration where neither the numerator nor
  // denominator are 1.
  using unusual_time = std::chrono::duration<int16_t, std::ratio<13, 3>>;
  ts.tv_sec = 141994;
  ts.tv_nsec = 666666666;
  EXPECT_EQ(32767, to<unusual_time>(ts).count());
  ts.tv_nsec = 666666667;
  EXPECT_THROW(to<unusual_time>(ts), std::range_error);

  ts.tv_sec = -141998;
  ts.tv_nsec = 999999999;
  EXPECT_EQ(-32768, to<unusual_time>(ts).count());
  ts.tv_sec = -141999;
  ts.tv_nsec = 0;
  EXPECT_THROW(to<unusual_time>(ts), std::range_error);
}

TEST(Conv, timevalToStdChrono) {
  struct timeval tv;

  tv.tv_sec = 0;
  tv.tv_usec = 10;
  EXPECT_EQ(10000ns, to<nanoseconds>(tv));
  EXPECT_EQ(10us, to<microseconds>(tv));
  EXPECT_EQ(0ms, to<milliseconds>(tv));
  EXPECT_EQ(0s, to<seconds>(tv));

  tv.tv_sec = 1;
  tv.tv_usec = 10;
  EXPECT_EQ(1000010000ns, to<nanoseconds>(tv));
  EXPECT_EQ(1000010us, to<microseconds>(tv));
  EXPECT_EQ(1000ms, to<milliseconds>(tv));
  EXPECT_EQ(1s, to<seconds>(tv));
  EXPECT_EQ(
      createTimePoint<system_clock>(1000010000ns),
      to<system_clock::time_point>(tv));
  EXPECT_EQ(
      createTimePoint<steady_clock>(1000010000ns),
      to<steady_clock::time_point>(tv));

  // Test a non-canonical value with tv_usec larger than 1 second
  tv.tv_sec = 5;
  tv.tv_usec = 3219876;
  EXPECT_EQ(8219876000LL, to<nanoseconds>(tv).count());
  EXPECT_EQ(8219876us, to<microseconds>(tv));
  EXPECT_EQ(8219ms, to<milliseconds>(tv));
  EXPECT_EQ(8s, to<seconds>(tv));
  EXPECT_EQ(
      createTimePoint<system_clock>(nanoseconds(8219876000LL)),
      to<system_clock::time_point>(tv));
  EXPECT_EQ(
      createTimePoint<steady_clock>(nanoseconds(8219876000LL)),
      to<steady_clock::time_point>(tv));

  // Test for overflow.
  if (std::numeric_limits<decltype(tv.tv_sec)>::max() >=
      std::numeric_limits<int64_t>::max()) {
    // Use our own type alias here rather than std::chrono::nanoseconds
    // to ensure we have 64-bit rep type.
    using nsec_i64 = std::chrono::duration<int64_t, std::nano>;
    tv.tv_sec = std::numeric_limits<decltype(tv.tv_sec)>::max();
    tv.tv_usec = std::numeric_limits<decltype(tv.tv_usec)>::max();
    EXPECT_THROW(to<nsec_i64>(tv), std::range_error);

    tv.tv_sec = std::numeric_limits<decltype(tv.tv_sec)>::min();
    tv.tv_usec = std::numeric_limits<decltype(tv.tv_usec)>::max();
    EXPECT_THROW(to<nsec_i64>(tv), std::range_error);
  }
}

TEST(Conv, stdChronoToTimespec) {
  auto ts = to<struct timespec>(10ns);
  EXPECT_EQ(0, ts.tv_sec);
  EXPECT_EQ(10, ts.tv_nsec);

  // We don't use std::chrono_literals suffixes here since older
  // gcc versions silently truncate the literals to 32-bits.
  ts = to<struct timespec>(nanoseconds(987654321012LL));
  EXPECT_EQ(987, ts.tv_sec);
  EXPECT_EQ(654321012, ts.tv_nsec);

  ts = to<struct timespec>(nanoseconds(-987654321012LL));
  EXPECT_EQ(-988, ts.tv_sec);
  EXPECT_EQ(345678988, ts.tv_nsec);

  ts = to<struct timespec>(microseconds(987654321012LL));
  EXPECT_EQ(987654, ts.tv_sec);
  EXPECT_EQ(321012000, ts.tv_nsec);

  ts = to<struct timespec>(milliseconds(987654321012LL));
  EXPECT_EQ(987654321, ts.tv_sec);
  EXPECT_EQ(12000000, ts.tv_nsec);

  ts = to<struct timespec>(seconds(987654321012LL));
  EXPECT_EQ(987654321012, ts.tv_sec);
  EXPECT_EQ(0, ts.tv_nsec);

  ts = to<struct timespec>(10h);
  EXPECT_EQ(36000, ts.tv_sec);
  EXPECT_EQ(0, ts.tv_nsec);

  ts = to<struct timespec>(createTimePoint<steady_clock>(123ns));
  EXPECT_EQ(0, ts.tv_sec);
  EXPECT_EQ(123, ts.tv_nsec);

  ts = to<struct timespec>(createTimePoint<system_clock>(123ns));
  EXPECT_EQ(0, ts.tv_sec);
  EXPECT_EQ(123, ts.tv_nsec);

  // Test with some unusual durations where neither the numerator nor
  // denominator are 1.
  using five_sevenths = std::chrono::duration<int64_t, std::ratio<5, 7>>;
  ts = to<struct timespec>(five_sevenths(7));
  EXPECT_EQ(5, ts.tv_sec);
  EXPECT_EQ(0, ts.tv_nsec);
  ts = to<struct timespec>(five_sevenths(19));
  EXPECT_EQ(13, ts.tv_sec);
  EXPECT_EQ(571428571, ts.tv_nsec);
  using seven_fifths = std::chrono::duration<int64_t, std::ratio<7, 5>>;
  ts = to<struct timespec>(seven_fifths(5));
  EXPECT_EQ(7, ts.tv_sec);
  EXPECT_EQ(0, ts.tv_nsec);
}

TEST(Conv, stdChronoToTimespecOverflow) {
  EXPECT_THROW(to<uint8_t>(1234), std::range_error);

  struct timespec ts;
  if (!std::is_same<decltype(ts.tv_sec), int64_t>::value) {
    LOG(INFO) << "skipping most overflow tests: time_t is not int64_t";
  } else {
    // Check for overflow converting from uint64_t seconds to time_t
    using sec_u64 = duration<uint64_t>;
    ts = to<struct timespec>(sec_u64(9223372036854775807ULL));
    EXPECT_EQ(ts.tv_sec, 9223372036854775807ULL);
    EXPECT_EQ(ts.tv_nsec, 0);

    EXPECT_THROW(
        to<struct timespec>(sec_u64(9223372036854775808ULL)), std::range_error);

    // Check for overflow converting from int64_t hours to time_t
    using hours_i64 = duration<int64_t, std::ratio<3600>>;
    ts = to<struct timespec>(hours_i64(2562047788015215LL));
    EXPECT_EQ(ts.tv_sec, 9223372036854774000LL);
    EXPECT_EQ(ts.tv_nsec, 0);
    EXPECT_THROW(
        to<struct timespec>(hours_i64(2562047788015216LL)), std::range_error);

    // Test overflows from an unusual duration where neither the numerator nor
    // denominator are 1.
    using three_halves = std::chrono::duration<uint64_t, std::ratio<3, 2>>;
    EXPECT_THROW(
        to<struct timespec>(three_halves(6148914691236517206ULL)),
        std::range_error);
  }

  // Test for overflow.
  // Use a custom hours type using time_t as the underlying storage type to
  // guarantee that we can overflow.
  using hours_timet = std::chrono::duration<time_t, std::ratio<3600>>;
  EXPECT_THROW(
      to<struct timespec>(hours_timet(std::numeric_limits<time_t>::max())),
      std::range_error);
}

TEST(Conv, stdChronoToTimeval) {
  auto tv = to<struct timeval>(10ns);
  EXPECT_EQ(0, tv.tv_sec);
  EXPECT_EQ(0, tv.tv_usec);

  tv = to<struct timeval>(10us);
  EXPECT_EQ(0, tv.tv_sec);
  EXPECT_EQ(10, tv.tv_usec);

  tv = to<struct timeval>(nanoseconds(987654321012LL));
  EXPECT_EQ(987, tv.tv_sec);
  EXPECT_EQ(654321, tv.tv_usec);

  tv = to<struct timeval>(nanoseconds(-987654321012LL));
  EXPECT_EQ(-988, tv.tv_sec);
  EXPECT_EQ(345679, tv.tv_usec);

  tv = to<struct timeval>(microseconds(987654321012LL));
  EXPECT_EQ(987654, tv.tv_sec);
  EXPECT_EQ(321012, tv.tv_usec);

  tv = to<struct timeval>(milliseconds(987654321012LL));
  EXPECT_EQ(987654321, tv.tv_sec);
  EXPECT_EQ(12000, tv.tv_usec);

  tv = to<struct timeval>(seconds(987654321012LL));
  EXPECT_EQ(987654321012, tv.tv_sec);
  EXPECT_EQ(0, tv.tv_usec);

  // Try converting fractional seconds
  tv = to<struct timeval>(duration<double>{3.456789});
  EXPECT_EQ(3, tv.tv_sec);
  EXPECT_EQ(456789, tv.tv_usec);
  tv = to<struct timeval>(duration<double>{-3.456789});
  EXPECT_EQ(-4, tv.tv_sec);
  EXPECT_EQ(543211, tv.tv_usec);

  // Try converting fractional hours
  tv = to<struct timeval>(duration<double, std::ratio<3600>>{3.456789});
  EXPECT_EQ(12444, tv.tv_sec);
  // The usec field is generally off-by-one due to
  // floating point rounding error
  EXPECT_NEAR(440400, tv.tv_usec, 1);
  tv = to<struct timeval>(duration<double, std::ratio<3600>>{-3.456789});
  EXPECT_EQ(-12445, tv.tv_sec);
  EXPECT_NEAR(559600, tv.tv_usec, 1);

  // Try converting fractional milliseconds
  tv = to<struct timeval>(duration<double, std::milli>{9123.456789});
  EXPECT_EQ(9, tv.tv_sec);
  EXPECT_EQ(123456, tv.tv_usec);
  tv = to<struct timeval>(duration<double, std::milli>{-9123.456789});
  EXPECT_EQ(-10, tv.tv_sec);
  EXPECT_NEAR(876544, tv.tv_usec, 1);

  tv = to<struct timeval>(duration<uint32_t, std::ratio<3600>>{3});
  EXPECT_EQ(10800, tv.tv_sec);
  EXPECT_EQ(0, tv.tv_usec);

  tv = to<struct timeval>(duration<uint32_t, std::nano>{3123});
  EXPECT_EQ(0, tv.tv_sec);
  EXPECT_EQ(3, tv.tv_usec);
  tv = to<struct timeval>(duration<int32_t, std::nano>{-3123});
  EXPECT_EQ(-1, tv.tv_sec);
  EXPECT_EQ(999997, tv.tv_usec);

  tv = to<struct timeval>(createTimePoint<steady_clock>(123us));
  EXPECT_EQ(0, tv.tv_sec);
  EXPECT_EQ(123, tv.tv_usec);

  tv = to<struct timeval>(createTimePoint<system_clock>(123us));
  EXPECT_EQ(0, tv.tv_sec);
  EXPECT_EQ(123, tv.tv_usec);
}
