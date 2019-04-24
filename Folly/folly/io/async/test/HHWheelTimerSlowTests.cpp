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
#include <folly/Random.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/HHWheelTimer.h>
#include <folly/io/async/test/UndelayedDestruction.h>
#include <folly/io/async/test/Util.h>
#include <folly/portability/GTest.h>

#include <thread>
#include <vector>

using namespace folly;
using std::chrono::milliseconds;

typedef UndelayedDestruction<HHWheelTimer> StackWheelTimer;

class TestTimeout : public HHWheelTimer::Callback {
 public:
  TestTimeout() {}
  TestTimeout(HHWheelTimer* t, milliseconds timeout) {
    t->scheduleTimeout(this, timeout);
  }

  void timeoutExpired() noexcept override {
    timestamps.emplace_back();
    if (fn) {
      fn();
    }
  }

  void callbackCanceled() noexcept override {
    canceledTimestamps.emplace_back();
    if (fn) {
      fn();
    }
  }

  std::deque<TimePoint> timestamps;
  std::deque<TimePoint> canceledTimestamps;
  std::function<void()> fn;
};

class TestTimeoutDelayed : public TestTimeout {
 protected:
  std::chrono::steady_clock::time_point getCurTime() override {
    return std::chrono::steady_clock::now() - milliseconds(5);
  }
};

struct HHWheelTimerTest : public ::testing::Test {
  EventBase eventBase;
};

/* Test takes ~2.5 minutes to run */
TEST_F(HHWheelTimerTest, Level2) {
  HHWheelTimer& t = eventBase.timer();

  TestTimeout t1;
  TestTimeout t2;

  ASSERT_EQ(t.count(), 0);

  t.scheduleTimeout(&t1, milliseconds(605 * 256));
  t.scheduleTimeout(&t2, milliseconds(300 * 256));

  ASSERT_EQ(t.count(), 2);

  TimePoint start;
  eventBase.loop();
  TimePoint end;

  ASSERT_EQ(t1.timestamps.size(), 1);
  ASSERT_EQ(t2.timestamps.size(), 1);
  ASSERT_EQ(t.count(), 0);

  // Check that the timeout was delayed by sleep
  T_CHECK_TIMEOUT(
      start,
      t1.timestamps[0],
      milliseconds(605 * 256),
      milliseconds(256 * 256));
  T_CHECK_TIMEOUT(
      start,
      t2.timestamps[0],
      milliseconds(300 * 256),
      milliseconds(256 * 256));
}

/*
 * Test the tick interval parameter
 */
TEST_F(HHWheelTimerTest, AtMostEveryN) {
  // Create a timeout set with a 10ms interval, to fire no more than once
  // every 3ms.
  milliseconds interval(10);
  milliseconds atMostEveryN(3);
  StackWheelTimer t(&eventBase, atMostEveryN);

  // Create 60 timeouts to be added to ts1 at 1ms intervals.
  uint32_t numTimeouts = 60;
  std::vector<TestTimeout> timeouts(numTimeouts);

  // Create a scheduler timeout to add the timeouts 1ms apart.
  uint32_t index = 0;
  StackWheelTimer ts1(&eventBase, milliseconds(1));
  TestTimeout scheduler(&ts1, milliseconds(1));
  scheduler.fn = [&] {
    if (index >= numTimeouts) {
      return;
    }
    // Call timeoutExpired() on the timeout so it will record a timestamp.
    // This is done only so we can record when we scheduled the timeout.
    // This way if ts1 starts to fall behind a little over time we will still
    // be comparing the ts1 timeouts to when they were first scheduled (rather
    // than when we intended to schedule them).  The scheduler may fall behind
    // eventually since we don't really schedule it once every millisecond.
    // Each time it finishes we schedule it for 1 millisecond in the future.
    // The amount of time it takes to run, and any delays it encounters
    // getting scheduled may eventually add up over time.
    timeouts[index].timeoutExpired();

    // Schedule the new timeout
    t.scheduleTimeout(&timeouts[index], interval);
    // Reschedule ourself
    ts1.scheduleTimeout(&scheduler, milliseconds(1));
    ++index;
  };

  TimePoint start;
  eventBase.loop();
  TimePoint end;

  // This should take roughly 60 + 10 ms to finish. If it takes more than
  // 250 ms to finish the system is probably heavily loaded, so skip.
  if (std::chrono::duration_cast<std::chrono::milliseconds>(
          end.getTime() - start.getTime())
          .count() > 250) {
    LOG(WARNING) << "scheduling all timeouts takes too long";
    return;
  }

  // We scheduled timeouts 1ms apart, when the HHWheelTimer is only allowed
  // to wake up at most once every 3ms.  It will therefore wake up every 3ms
  // and fire groups of approximately 3 timeouts at a time.
  //
  // This is "approximately 3" since it may get slightly behind and fire 4 in
  // one interval, etc.  T_CHECK_TIMEOUT normally allows a few milliseconds of
  // tolerance.  We have to add the same into our checking algorithm here.
  for (uint32_t idx = 0; idx < numTimeouts; ++idx) {
    ASSERT_EQ(timeouts[idx].timestamps.size(), 2);

    TimePoint scheduledTime(timeouts[idx].timestamps[0]);
    TimePoint firedTime(timeouts[idx].timestamps[1]);

    // Assert that the timeout fired at roughly the right time.
    // T_CHECK_TIMEOUT() normally has a tolerance of 5ms.  Allow an additional
    // atMostEveryN.
    milliseconds tolerance = milliseconds(5) + interval;
    T_CHECK_TIMEOUT(scheduledTime, firedTime, atMostEveryN, tolerance);

    // Assert that the difference between the previous timeout and now was
    // either very small (fired in the same event loop), or larger than
    // atMostEveryN.
    if (idx == 0) {
      // no previous value
      continue;
    }
    TimePoint prev(timeouts[idx - 1].timestamps[1]);

    auto delta = (firedTime.getTimeStart() - prev.getTimeEnd()) -
        (firedTime.getTimeWaiting() - prev.getTimeWaiting());
    if (delta > milliseconds(1)) {
      T_CHECK_TIMEOUT(prev, firedTime, atMostEveryN);
    }
  }
}

/*
 * Test an event loop that is blocking
 */

TEST_F(HHWheelTimerTest, SlowLoop) {
  StackWheelTimer t(&eventBase, milliseconds(1));

  TestTimeout t1;
  TestTimeout t2;

  ASSERT_EQ(t.count(), 0);

  eventBase.runInLoop([]() {
    /* sleep override */
    std::this_thread::sleep_for(std::chrono::microseconds(10000));
  });
  t.scheduleTimeout(&t1, milliseconds(5));

  ASSERT_EQ(t.count(), 1);

  TimePoint start;
  eventBase.loop();
  TimePoint end;

  ASSERT_EQ(t1.timestamps.size(), 1);
  ASSERT_EQ(t.count(), 0);

  // Check that the timeout was delayed by sleep
  T_CHECK_TIMEOUT(start, t1.timestamps[0], milliseconds(10), milliseconds(1));
  T_CHECK_TIMEOUT(start, end, milliseconds(10), milliseconds(1));

  eventBase.runInLoop([]() {
    /* sleep override */
    std::this_thread::sleep_for(std::chrono::microseconds(10000));
  });
  t.scheduleTimeout(&t2, milliseconds(5));

  ASSERT_EQ(t.count(), 1);

  TimePoint start2;
  eventBase.loop();
  TimePoint end2;

  ASSERT_EQ(t2.timestamps.size(), 1);
  ASSERT_EQ(t.count(), 0);

  // Check that the timeout was NOT delayed by sleep
  T_CHECK_TIMEOUT(start2, t2.timestamps[0], milliseconds(10), milliseconds(1));
  T_CHECK_TIMEOUT(start2, end2, milliseconds(10), milliseconds(1));
}

/*
 * Test upper timer levels.  Slow by necessity :/
 */

TEST_F(HHWheelTimerTest, Level1) {
  HHWheelTimer& t = eventBase.timer();

  TestTimeout t1;
  TestTimeout t2;

  ASSERT_EQ(t.count(), 0);

  t.scheduleTimeout(&t1, milliseconds(605));
  t.scheduleTimeout(&t2, milliseconds(300));

  ASSERT_EQ(t.count(), 2);

  TimePoint start;
  eventBase.loop();
  TimePoint end;

  ASSERT_EQ(t1.timestamps.size(), 1);
  ASSERT_EQ(t2.timestamps.size(), 1);
  ASSERT_EQ(t.count(), 0);

  // Check that the timeout was delayed by sleep
  T_CHECK_TIMEOUT(
      start, t1.timestamps[0], milliseconds(605), milliseconds(256));
  T_CHECK_TIMEOUT(
      start, t2.timestamps[0], milliseconds(300), milliseconds(256));
}

TEST_F(HHWheelTimerTest, Stress) {
  StackWheelTimer t(&eventBase, milliseconds(1));

  long timeoutcount = 10000;
  TestTimeout timeouts[10000];
  long runtimeouts = 0;
  for (long i = 0; i < timeoutcount; i++) {
    long timeout = Random::rand32(1, 10000);
    if (Random::rand32(3)) {
      // NOTE: hhwheel timer runs before eventbase runAfterDelay,
      // so runAfterDelay cancelTimeout() must run  at least one timerwheel
      // before scheduleTimeout, to ensure it runs first.
      timeout += 256;
      t.scheduleTimeout(&timeouts[i], std::chrono::milliseconds(timeout));
      eventBase.runAfterDelay(
          [&, i]() {
            timeouts[i].fn = nullptr;
            timeouts[i].cancelTimeout();
            runtimeouts++;
            LOG(INFO) << "Ran " << runtimeouts << " timeouts, cancelled";
          },
          timeout - 256);
      timeouts[i].fn = [&, i, timeout]() {
        LOG(INFO) << "FAIL:timer " << i << " still fired in " << timeout;
        ADD_FAILURE();
      };
    } else {
      t.scheduleTimeout(&timeouts[i], std::chrono::milliseconds(timeout));
      timeouts[i].fn = [&, i]() {
        timeoutcount++;
        long newtimeout = Random::rand32(1, 10000);
        t.scheduleTimeout(&timeouts[i], std::chrono::milliseconds(newtimeout));
        runtimeouts++;
        /* sleep override */ usleep(1000);
        LOG(INFO) << "Ran " << runtimeouts << " timeouts of " << timeoutcount;
        timeouts[i].fn = [&]() {
          runtimeouts++;
          LOG(INFO) << "Ran " << runtimeouts << " timeouts of " << timeoutcount;
        };
      };
    }
  }

  LOG(INFO) << "RUNNING TEST";
  eventBase.loop();

  EXPECT_EQ(runtimeouts, timeoutcount);
}
