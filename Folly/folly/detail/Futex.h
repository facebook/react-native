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

#pragma once

#include <atomic>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <limits>
#include <type_traits>

#include <folly/portability/Unistd.h>

namespace folly {
namespace detail {

enum class FutexResult {
  VALUE_CHANGED, /* futex value didn't match expected */
  AWOKEN, /* wakeup by matching futex wake, or spurious wakeup */
  INTERRUPTED, /* wakeup by interrupting signal */
  TIMEDOUT, /* wakeup by expiring deadline */
};

/**
 * Futex is an atomic 32 bit unsigned integer that provides access to the
 * futex() syscall on that value.  It is templated in such a way that it
 * can interact properly with DeterministicSchedule testing.
 *
 * If you don't know how to use futex(), you probably shouldn't be using
 * this class.  Even if you do know how, you should have a good reason
 * (and benchmarks to back you up).
 *
 * Because of the semantics of the futex syscall, the futex family of
 * functions are available as free functions rather than member functions
 */
template <template <typename> class Atom = std::atomic>
using Futex = Atom<std::uint32_t>;

/**
 * Puts the thread to sleep if this->load() == expected.  Returns true when
 * it is returning because it has consumed a wake() event, false for any
 * other return (signal, this->load() != expected, or spurious wakeup).
 */
template <typename Futex>
FutexResult
futexWait(const Futex* futex, uint32_t expected, uint32_t waitMask = -1);

/**
 * Similar to futexWait but also accepts a deadline until when the wait call
 * may block.
 *
 * Optimal clock types: std::chrono::system_clock, std::chrono::steady_clock.
 * NOTE: On some systems steady_clock is just an alias for system_clock,
 * and is not actually steady.
 *
 * For any other clock type, now() will be invoked twice.
 */
template <
    typename Futex,
    class Clock,
    class Duration = typename Clock::duration>
FutexResult futexWaitUntil(
    const Futex* futex,
    uint32_t expected,
    std::chrono::time_point<Clock, Duration> const& deadline,
    uint32_t waitMask = -1);

/**
 * Wakes up to count waiters where (waitMask & wakeMask) != 0, returning the
 * number of awoken threads, or -1 if an error occurred.  Note that when
 * constructing a concurrency primitive that can guard its own destruction, it
 * is likely that you will want to ignore EINVAL here (as well as making sure
 * that you never touch the object after performing the memory store that is
 * the linearization point for unlock or control handoff).  See
 * https://sourceware.org/bugzilla/show_bug.cgi?id=13690
 */
template <typename Futex>
int futexWake(
    const Futex* futex,
    int count = std::numeric_limits<int>::max(),
    uint32_t wakeMask = -1);

/** A std::atomic subclass that can be used to force Futex to emulate
 *  the underlying futex() syscall.  This is primarily useful to test or
 *  benchmark the emulated implementation on systems that don't need it. */
template <typename T>
struct EmulatedFutexAtomic : public std::atomic<T> {
  EmulatedFutexAtomic() noexcept = default;
  constexpr /* implicit */ EmulatedFutexAtomic(T init) noexcept
      : std::atomic<T>(init) {}
  // It doesn't copy or move
  EmulatedFutexAtomic(EmulatedFutexAtomic&& rhs) = delete;
};

} // namespace detail
} // namespace folly

#include <folly/detail/Futex-inl.h>
