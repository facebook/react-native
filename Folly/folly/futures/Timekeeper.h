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

#pragma once

#include <folly/futures/detail/Types.h>
#include <folly/Unit.h>

namespace folly {

template <class> class Future;

/// A Timekeeper handles the details of keeping time and fulfilling delay
/// promises. The returned Future<Unit> will either complete after the
/// elapsed time, or in the event of some kind of exceptional error may hold
/// an exception. These Futures respond to cancellation. If you use a lot of
/// Delays and many of them ultimately are unneeded (as would be the case for
/// Delays that are used to trigger timeouts of async operations), then you
/// can and should cancel them to reclaim resources.
///
/// Users will typically get one of these via Future::sleep(Duration) or
/// use them implicitly behind the scenes by passing a timeout to some Future
/// operation.
///
/// Although we don't formally alias Delay = Future<Unit>,
/// that's an appropriate term for it. People will probably also call these
/// Timeouts, and that's ok I guess, but that term is so overloaded I thought
/// it made sense to introduce a cleaner term.
///
/// Remember that Duration is a std::chrono duration (millisecond resolution
/// at the time of writing). When writing code that uses specific durations,
/// prefer using the explicit std::chrono type, e.g. std::chrono::milliseconds
/// over Duration. This makes the code more legible and means you won't be
/// unpleasantly surprised if we redefine Duration to microseconds, or
/// something.
///
///    timekeeper.after(std::chrono::duration_cast<Duration>(
///      someNanoseconds))
class Timekeeper {
 public:
  virtual ~Timekeeper() = default;

  /// Returns a future that will complete after the given duration with the
  /// elapsed time. Exceptional errors can happen but they must be
  /// exceptional. Use the steady (monotonic) clock.
  ///
  /// You may cancel this Future to reclaim resources.
  ///
  /// This future probably completes on the timer thread. You should almost
  /// certainly follow it with a via() call or the accuracy of other timers
  /// will suffer.
  virtual Future<Unit> after(Duration) = 0;

  /// Returns a future that will complete at the requested time.
  ///
  /// You may cancel this Future to reclaim resources.
  ///
  /// NB This is sugar for `after(when - now)`, so while you are welcome to
  /// use a std::chrono::system_clock::time_point it will not track changes to
  /// the system clock but rather execute that many milliseconds in the future
  /// according to the steady clock.
  template <class Clock>
  Future<Unit> at(std::chrono::time_point<Clock> when);
};

} // namespace folly

// now get those definitions
#include <folly/futures/Future.h>

// finally we can use Future
namespace folly {

template <class Clock>
Future<Unit> Timekeeper::at(std::chrono::time_point<Clock> when) {
  auto now = Clock::now();

  if (when <= now) {
    return makeFuture();
  }

  return after(std::chrono::duration_cast<Duration>(when - now));
}

} // namespace folly
