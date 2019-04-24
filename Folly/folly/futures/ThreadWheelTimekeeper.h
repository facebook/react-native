/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/futures/Future.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/HHWheelTimer.h>
#include <thread>

namespace folly {

/// The default Timekeeper implementation which uses a HHWheelTimer on an
/// EventBase in a dedicated thread. Users needn't deal with this directly, it
/// is used by default by Future methods that work with timeouts.
class ThreadWheelTimekeeper : public Timekeeper {
 public:
  /// But it doesn't *have* to be a singleton.
  ThreadWheelTimekeeper();
  ~ThreadWheelTimekeeper() override;

  /// Implement the Timekeeper interface
  /// This future *does* complete on the timer thread. You should almost
  /// certainly follow it with a via() call or the accuracy of other timers
  /// will suffer.
  Future<Unit> after(Duration) override;

 protected:
  folly::EventBase eventBase_;
  std::thread thread_;
  HHWheelTimer::UniquePtr wheelTimer_;
};

} // namespace folly
