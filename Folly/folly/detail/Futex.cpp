/*
 * Copyright 2013-present Facebook, Inc.
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
#include <folly/detail/Futex.h>
#include <folly/ScopeGuard.h>
#include <folly/hash/Hash.h>
#include <folly/portability/SysSyscall.h>
#include <stdint.h>
#include <string.h>
#include <array>
#include <cerrno>

#include <folly/synchronization/ParkingLot.h>

#ifdef __linux__
#include <linux/futex.h>
#endif

using namespace std::chrono;

namespace folly {
namespace detail {

namespace {

////////////////////////////////////////////////////
// native implementation using the futex() syscall

#ifdef __linux__

/// Certain toolchains (like Android's) don't include the full futex API in
/// their headers even though they support it. Make sure we have our constants
/// even if the headers don't have them.
#ifndef FUTEX_WAIT_BITSET
#define FUTEX_WAIT_BITSET 9
#endif
#ifndef FUTEX_WAKE_BITSET
#define FUTEX_WAKE_BITSET 10
#endif
#ifndef FUTEX_PRIVATE_FLAG
#define FUTEX_PRIVATE_FLAG 128
#endif
#ifndef FUTEX_CLOCK_REALTIME
#define FUTEX_CLOCK_REALTIME 256
#endif

int nativeFutexWake(const void* addr, int count, uint32_t wakeMask) {
  int rv = syscall(
      __NR_futex,
      addr, /* addr1 */
      FUTEX_WAKE_BITSET | FUTEX_PRIVATE_FLAG, /* op */
      count, /* val */
      nullptr, /* timeout */
      nullptr, /* addr2 */
      wakeMask); /* val3 */

  /* NOTE: we ignore errors on wake for the case of a futex
     guarding its own destruction, similar to this
     glibc bug with sem_post/sem_wait:
     https://sourceware.org/bugzilla/show_bug.cgi?id=12674 */
  if (rv < 0) {
    return 0;
  }
  return rv;
}

template <class Clock>
struct timespec timeSpecFromTimePoint(time_point<Clock> absTime) {
  auto epoch = absTime.time_since_epoch();
  if (epoch.count() < 0) {
    // kernel timespec_valid requires non-negative seconds and nanos in [0,1G)
    epoch = Clock::duration::zero();
  }

  // timespec-safe seconds and nanoseconds;
  // chrono::{nano,}seconds are `long long int`
  // whereas timespec uses smaller types
  using time_t_seconds = duration<std::time_t, seconds::period>;
  using long_nanos = duration<long int, nanoseconds::period>;

  auto secs = duration_cast<time_t_seconds>(epoch);
  auto nanos = duration_cast<long_nanos>(epoch - secs);
  struct timespec result = {secs.count(), nanos.count()};
  return result;
}

FutexResult nativeFutexWaitImpl(
    const void* addr,
    uint32_t expected,
    system_clock::time_point const* absSystemTime,
    steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask) {
  assert(absSystemTime == nullptr || absSteadyTime == nullptr);

  int op = FUTEX_WAIT_BITSET | FUTEX_PRIVATE_FLAG;
  struct timespec ts;
  struct timespec* timeout = nullptr;

  if (absSystemTime != nullptr) {
    op |= FUTEX_CLOCK_REALTIME;
    ts = timeSpecFromTimePoint(*absSystemTime);
    timeout = &ts;
  } else if (absSteadyTime != nullptr) {
    ts = timeSpecFromTimePoint(*absSteadyTime);
    timeout = &ts;
  }

  // Unlike FUTEX_WAIT, FUTEX_WAIT_BITSET requires an absolute timeout
  // value - http://locklessinc.com/articles/futex_cheat_sheet/
  int rv = syscall(
      __NR_futex,
      addr, /* addr1 */
      op, /* op */
      expected, /* val */
      timeout, /* timeout */
      nullptr, /* addr2 */
      waitMask); /* val3 */

  if (rv == 0) {
    return FutexResult::AWOKEN;
  } else {
    switch (errno) {
      case ETIMEDOUT:
        assert(timeout != nullptr);
        return FutexResult::TIMEDOUT;
      case EINTR:
        return FutexResult::INTERRUPTED;
      case EWOULDBLOCK:
        return FutexResult::VALUE_CHANGED;
      default:
        assert(false);
        // EINVAL, EACCESS, or EFAULT.  EINVAL means there was an invalid
        // op (should be impossible) or an invalid timeout (should have
        // been sanitized by timeSpecFromTimePoint).  EACCESS or EFAULT
        // means *addr points to invalid memory, which is unlikely because
        // the caller should have segfaulted already.  We can either
        // crash, or return a value that lets the process continue for
        // a bit. We choose the latter. VALUE_CHANGED probably turns the
        // caller into a spin lock.
        return FutexResult::VALUE_CHANGED;
    }
  }
}

#endif // __linux__

///////////////////////////////////////////////////////
// compatibility implementation using standard C++ API

using Lot = ParkingLot<uint32_t>;
Lot parkingLot;

int emulatedFutexWake(const void* addr, int count, uint32_t waitMask) {
  int woken = 0;
  parkingLot.unpark(addr, [&](const uint32_t& mask) {
    if ((mask & waitMask) == 0) {
      return UnparkControl::RetainContinue;
    }
    assert(count > 0);
    count--;
    woken++;
    return count > 0 ? UnparkControl::RemoveContinue
                     : UnparkControl::RemoveBreak;
  });
  return woken;
}

template <typename F>
FutexResult emulatedFutexWaitImpl(
    F* futex,
    uint32_t expected,
    system_clock::time_point const* absSystemTime,
    steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask) {
  static_assert(
      std::is_same<F, const Futex<std::atomic>>::value ||
          std::is_same<F, const Futex<EmulatedFutexAtomic>>::value,
      "Type F must be either Futex<std::atomic> or Futex<EmulatedFutexAtomic>");
  ParkResult res;
  if (absSystemTime) {
    res = parkingLot.park_until(
        futex,
        waitMask,
        [&] { return *futex == expected; },
        [] {},
        *absSystemTime);
  } else if (absSteadyTime) {
    res = parkingLot.park_until(
        futex,
        waitMask,
        [&] { return *futex == expected; },
        [] {},
        *absSteadyTime);
  } else {
    res = parkingLot.park(
        futex, waitMask, [&] { return *futex == expected; }, [] {});
  }
  switch (res) {
    case ParkResult::Skip:
      return FutexResult::VALUE_CHANGED;
    case ParkResult::Unpark:
      return FutexResult::AWOKEN;
    case ParkResult::Timeout:
      return FutexResult::TIMEDOUT;
  }

  return FutexResult::INTERRUPTED;
}

} // namespace

/////////////////////////////////
// Futex<> overloads

int futexWakeImpl(
    const Futex<std::atomic>* futex,
    int count,
    uint32_t wakeMask) {
#ifdef __linux__
  return nativeFutexWake(futex, count, wakeMask);
#else
  return emulatedFutexWake(futex, count, wakeMask);
#endif
}

int futexWakeImpl(
    const Futex<EmulatedFutexAtomic>* futex,
    int count,
    uint32_t wakeMask) {
  return emulatedFutexWake(futex, count, wakeMask);
}

FutexResult futexWaitImpl(
    const Futex<std::atomic>* futex,
    uint32_t expected,
    system_clock::time_point const* absSystemTime,
    steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask) {
#ifdef __linux__
  return nativeFutexWaitImpl(
      futex, expected, absSystemTime, absSteadyTime, waitMask);
#else
  return emulatedFutexWaitImpl(
      futex, expected, absSystemTime, absSteadyTime, waitMask);
#endif
}

FutexResult futexWaitImpl(
    const Futex<EmulatedFutexAtomic>* futex,
    uint32_t expected,
    system_clock::time_point const* absSystemTime,
    steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask) {
  return emulatedFutexWaitImpl(
      futex, expected, absSystemTime, absSteadyTime, waitMask);
}

} // namespace detail
} // namespace folly
