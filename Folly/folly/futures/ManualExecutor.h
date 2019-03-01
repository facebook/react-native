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
#include <folly/LifoSem.h>
#include <folly/futures/DrivableExecutor.h>
#include <folly/futures/ScheduledExecutor.h>
#include <memory>
#include <mutex>
#include <queue>
#include <cstdio>

namespace folly {
  /// A ManualExecutor only does work when you turn the crank, by calling
  /// run() or indirectly with makeProgress() or waitFor().
  ///
  /// The clock for a manual executor starts at 0 and advances only when you
  /// ask it to. i.e. time is also under manual control.
  ///
  /// NB No attempt has been made to make anything other than add and schedule
  /// threadsafe.
  class ManualExecutor : public DrivableExecutor,
                         public ScheduledExecutor {
   public:
    void add(Func) override;

    /// Do work. Returns the number of functions that were executed (maybe 0).
    /// Non-blocking, in the sense that we don't wait for work (we can't
    /// control whether one of the functions blocks).
    /// This is stable, it will not chase an ever-increasing tail of work.
    /// This also means, there may be more work available to perform at the
    /// moment that this returns.
    size_t run();

    /// Wait for work to do.
    void wait();

    /// Wait for work to do, and do it.
    void makeProgress() {
      wait();
      run();
    }

    /// Implements DrivableExecutor
    void drive() override {
      makeProgress();
    }

    /// makeProgress until this Future is ready.
    template <class F> void waitFor(F const& f) {
      // TODO(5427828)
#if 0
      while (!f.isReady())
        makeProgress();
#else
      while (!f.isReady()) {
        run();
      }
#endif

    }

    virtual void scheduleAt(Func&& f, TimePoint const& t) override {
      std::lock_guard<std::mutex> lock(lock_);
      scheduledFuncs_.emplace(t, std::move(f));
      sem_.post();
    }

    /// Advance the clock. The clock never advances on its own.
    /// Advancing the clock causes some work to be done, if work is available
    /// to do (perhaps newly available because of the advanced clock).
    /// If dur is <= 0 this is a noop.
    void advance(Duration const& dur) {
      advanceTo(now_ + dur);
    }

    /// Advance the clock to this absolute time. If t is <= now(),
    /// this is a noop.
    void advanceTo(TimePoint const& t);

    TimePoint now() override { return now_; }

    /// Flush the function queue. Destroys all stored functions without
    /// executing them. Returns number of removed functions.
    std::size_t clear() {
      std::queue<Func> funcs;
      std::priority_queue<ScheduledFunc> scheduled_funcs;

      {
        std::lock_guard<std::mutex> lock(lock_);
        funcs_.swap(funcs);
        scheduledFuncs_.swap(scheduled_funcs);
      }

      return funcs.size() + scheduled_funcs.size();
    }

   private:
    std::mutex lock_;
    std::queue<Func> funcs_;
    LifoSem sem_;

    // helper class to enable ordering of scheduled events in the priority
    // queue
    struct ScheduledFunc {
      TimePoint time;
      size_t ordinal;
      Func mutable func;

      ScheduledFunc(TimePoint const& t, Func&& f)
        : time(t), func(std::move(f))
      {
        static size_t seq = 0;
        ordinal = seq++;
      }

      bool operator<(ScheduledFunc const& b) const {
        if (time == b.time)
          return ordinal < b.ordinal;
        return time < b.time;
      }

      Func&& moveOutFunc() const {
        return std::move(func);
      }
    };
    std::priority_queue<ScheduledFunc> scheduledFuncs_;
    TimePoint now_ = now_.min();
  };

}
