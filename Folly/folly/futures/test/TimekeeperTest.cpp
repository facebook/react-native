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

#include <folly/Singleton.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/futures/Future.h>
#include <folly/futures/ThreadWheelTimekeeper.h>
#include <folly/portability/GTest.h>

using namespace folly;
using std::chrono::milliseconds;

std::chrono::milliseconds const zero_ms(0);
std::chrono::milliseconds const one_ms(1);
std::chrono::milliseconds const awhile(10);
std::chrono::seconds const too_long(10);

std::chrono::steady_clock::time_point now() {
  return std::chrono::steady_clock::now();
}

struct TimekeeperFixture : public testing::Test {
  TimekeeperFixture() : timeLord_(folly::detail::getTimekeeperSingleton()) {}

  std::shared_ptr<Timekeeper> timeLord_;
};

TEST_F(TimekeeperFixture, after) {
  auto t1 = now();
  auto f = timeLord_->after(awhile);
  EXPECT_FALSE(f.isReady());
  std::move(f).get();
  auto t2 = now();

  EXPECT_GE(t2 - t1, awhile);
}

TEST(Timekeeper, futureGet) {
  Promise<int> p;
  auto t = std::thread([&] { p.setValue(42); });
  EXPECT_EQ(42, p.getFuture().get());
  t.join();
}

TEST(Timekeeper, futureGetBeforeTimeout) {
  Promise<int> p;
  auto t = std::thread([&] { p.setValue(42); });
  // Technically this is a race and if the test server is REALLY overloaded
  // and it takes more than a second to do that thread it could be flaky. But
  // I want a low timeout (in human terms) so if this regresses and someone
  // runs it by hand they're not sitting there forever wondering why it's
  // blocked, and get a useful error message instead. If it does get flaky,
  // empirically increase the timeout to the point where it's very improbable.
  EXPECT_EQ(42, p.getFuture().get(std::chrono::seconds(2)));
  t.join();
}

TEST(Timekeeper, futureGetTimeout) {
  Promise<int> p;
  EXPECT_THROW(p.getFuture().get(one_ms), folly::FutureTimeout);
}

TEST(Timekeeper, futureSleep) {
  auto t1 = now();
  futures::sleep(one_ms).get();
  EXPECT_GE(now() - t1, one_ms);
}

TEST(Timekeeper, futureSleepHandlesNullTimekeeperSingleton) {
  Singleton<ThreadWheelTimekeeper>::make_mock([] { return nullptr; });
  SCOPE_EXIT {
    Singleton<ThreadWheelTimekeeper>::make_mock();
  };
  EXPECT_THROW(futures::sleep(one_ms).get(), FutureNoTimekeeper);
}

TEST(Timekeeper, futureWithinHandlesNullTimekeeperSingleton) {
  Singleton<ThreadWheelTimekeeper>::make_mock([] { return nullptr; });
  SCOPE_EXIT {
    Singleton<ThreadWheelTimekeeper>::make_mock();
  };
  Promise<int> p;
  auto f = p.getFuture().within(one_ms);
  EXPECT_THROW(std::move(f).get(), FutureNoTimekeeper);
}

TEST(Timekeeper, semiFutureWithinHandlesNullTimekeeperSingleton) {
  Singleton<ThreadWheelTimekeeper>::make_mock([] { return nullptr; });
  SCOPE_EXIT {
    Singleton<ThreadWheelTimekeeper>::make_mock();
  };
  Promise<int> p;
  auto f = p.getSemiFuture().within(one_ms);
  EXPECT_THROW(std::move(f).get(), FutureNoTimekeeper);
}

TEST(Timekeeper, futureDelayed) {
  auto t1 = now();
  auto dur = makeFuture()
                 .delayed(one_ms)
                 .thenValue([=](auto&&) { return now() - t1; })
                 .get();

  EXPECT_GE(dur, one_ms);
}

TEST(Timekeeper, semiFutureDelayed) {
  auto t1 = now();
  auto dur = makeSemiFuture()
                 .delayed(one_ms)
                 .toUnsafeFuture()
                 .thenValue([=](auto&&) { return now() - t1; })
                 .get();

  EXPECT_GE(dur, one_ms);
}

TEST(Timekeeper, futureDelayedUnsafe) {
  auto t1 = now();
  auto dur = makeFuture()
                 .delayedUnsafe(one_ms)
                 .thenValue([=](auto&&) { return now() - t1; })
                 .get();

  EXPECT_GE(dur, one_ms);
}

TEST(Timekeeper, futureDelayedStickyExecutor) {
  // Check that delayed without an executor binds the inline executor.
  {
    auto t1 = now();
    class TimekeeperHelper : public ThreadWheelTimekeeper {
     public:
      std::thread::id get_thread_id() {
        return thread_.get_id();
      }
    };
    TimekeeperHelper tk;
    std::thread::id timekeeper_thread_id = tk.get_thread_id();
    std::thread::id task_thread_id{};
    auto dur = makeFuture()
                   .delayed(one_ms, &tk)
                   .thenValue([=, &task_thread_id](auto&&) {
                     task_thread_id = std::this_thread::get_id();
                     return now() - t1;
                   })
                   .get();

    EXPECT_GE(dur, one_ms);
    EXPECT_EQ(timekeeper_thread_id, task_thread_id);
  }

  // Check that delayed applied to an executor returns a future that binds
  // to the same executor as was input.
  {
    auto t1 = now();
    std::thread::id driver_thread_id{};
    std::thread::id first_task_thread_id{};
    std::thread::id second_task_thread_id{};
    folly::ManualExecutor me;
    std::atomic<bool> stop_signal{false};
    std::thread me_driver{[&me, &driver_thread_id, &stop_signal] {
      driver_thread_id = std::this_thread::get_id();
      while (!stop_signal) {
        me.run();
      }
    }};
    auto dur = makeSemiFuture()
                   .via(&me)
                   .thenValue([&first_task_thread_id](auto&&) {
                     first_task_thread_id = std::this_thread::get_id();
                   })
                   .delayed(one_ms)
                   .thenValue([=, &second_task_thread_id](auto&&) {
                     second_task_thread_id = std::this_thread::get_id();
                     return now() - t1;
                   })
                   .get();
    stop_signal = true;
    me_driver.join();
    EXPECT_GE(dur, one_ms);
    EXPECT_EQ(driver_thread_id, first_task_thread_id);
    EXPECT_EQ(driver_thread_id, second_task_thread_id);
  }
}

TEST(Timekeeper, futureWithinThrows) {
  Promise<int> p;
  auto f =
      p.getFuture().within(one_ms).onError([](FutureTimeout&) { return -1; });

  EXPECT_EQ(-1, std::move(f).get());
}

TEST(Timekeeper, semiFutureWithinThrows) {
  Promise<int> p;
  auto f = p.getSemiFuture().within(one_ms).toUnsafeFuture().onError(
      [](FutureTimeout&) { return -1; });

  EXPECT_EQ(-1, std::move(f).get());
}

TEST(Timekeeper, futureWithinAlreadyComplete) {
  auto f =
      makeFuture(42).within(one_ms).onError([&](FutureTimeout&) { return -1; });

  EXPECT_EQ(42, std::move(f).get());
}

TEST(Timekeeper, semiFutureWithinAlreadyComplete) {
  auto f = makeSemiFuture(42).within(one_ms).toUnsafeFuture().onError(
      [&](FutureTimeout&) { return -1; });

  EXPECT_EQ(42, std::move(f).get());
}

TEST(Timekeeper, futureWithinFinishesInTime) {
  Promise<int> p;
  auto f = p.getFuture()
               .within(std::chrono::minutes(1))
               .onError([&](FutureTimeout&) { return -1; });
  p.setValue(42);

  EXPECT_EQ(42, std::move(f).get());
}

TEST(Timekeeper, semiFutureWithinFinishesInTime) {
  Promise<int> p;
  auto f = p.getSemiFuture()
               .within(std::chrono::minutes(1))
               .toUnsafeFuture()
               .onError([&](FutureTimeout&) { return -1; });
  p.setValue(42);

  EXPECT_EQ(42, std::move(f).get());
}

TEST(Timekeeper, futureWithinVoidSpecialization) {
  makeFuture().within(one_ms);
}

TEST(Timekeeper, semiFutureWithinVoidSpecialization) {
  makeSemiFuture().within(one_ms);
}

TEST(Timekeeper, futureWithinException) {
  Promise<Unit> p;
  auto f = p.getFuture().within(awhile, std::runtime_error("expected"));
  EXPECT_THROW(std::move(f).get(), std::runtime_error);
}

TEST(Timekeeper, semiFutureWithinException) {
  Promise<Unit> p;
  auto f = p.getSemiFuture().within(awhile, std::runtime_error("expected"));
  EXPECT_THROW(std::move(f).get(), std::runtime_error);
}

TEST(Timekeeper, onTimeout) {
  bool flag = false;
  makeFuture(42)
      .delayed(10 * one_ms)
      .onTimeout(
          zero_ms,
          [&] {
            flag = true;
            return -1;
          })
      .get();
  EXPECT_TRUE(flag);
}

TEST(Timekeeper, onTimeoutComplete) {
  bool flag = false;
  makeFuture(42)
      .onTimeout(
          zero_ms,
          [&] {
            flag = true;
            return -1;
          })
      .get();
  EXPECT_FALSE(flag);
}

TEST(Timekeeper, onTimeoutReturnsFuture) {
  bool flag = false;
  makeFuture(42)
      .delayed(10 * one_ms)
      .onTimeout(
          zero_ms,
          [&] {
            flag = true;
            return makeFuture(-1);
          })
      .get();
  EXPECT_TRUE(flag);
}

TEST(Timekeeper, onTimeoutVoid) {
  makeFuture().delayed(one_ms).onTimeout(zero_ms, [&] {});
  makeFuture().delayed(one_ms).onTimeout(zero_ms, [&] {
    return makeFuture<Unit>(std::runtime_error("expected"));
  });
  // just testing compilation here
}

TEST(Timekeeper, interruptDoesntCrash) {
  auto f = futures::sleep(too_long);
  f.cancel();
}

TEST(Timekeeper, chainedInterruptTest) {
  bool test = false;
  auto f =
      futures::sleep(milliseconds(100)).thenValue([&](auto&&) { test = true; });
  f.cancel();
  f.wait();
  EXPECT_FALSE(test);
}

TEST(Timekeeper, futureWithinChainedInterruptTest) {
  bool test = false;
  Promise<Unit> p;
  p.setInterruptHandler([&test, &p](const exception_wrapper& ex) {
    ex.handle(
        [&test](const FutureCancellation& /* cancellation */) { test = true; });
    p.setException(ex);
  });
  auto f = p.getFuture().within(milliseconds(100));
  EXPECT_FALSE(test) << "Sanity check";
  f.cancel();
  f.wait();
  EXPECT_TRUE(test);
}

TEST(Timekeeper, semiFutureWithinChainedInterruptTest) {
  bool test = false;
  Promise<Unit> p;
  p.setInterruptHandler([&test, &p](const exception_wrapper& ex) {
    ex.handle(
        [&test](const FutureCancellation& /* cancellation */) { test = true; });
    p.setException(ex);
  });
  auto f = p.getSemiFuture().within(milliseconds(100));
  EXPECT_FALSE(test) << "Sanity check";
  f.cancel();
  f.wait();
  EXPECT_TRUE(test);
}

TEST(Timekeeper, executor) {
  class ExecutorTester : public Executor {
   public:
    void add(Func f) override {
      count++;
      f();
    }
    std::atomic<int> count{0};
  };

  Promise<Unit> p;
  ExecutorTester tester;
  auto f = p.getFuture().via(&tester).within(one_ms).thenValue([&](auto&&) {});
  p.setValue();
  f.wait();
  EXPECT_EQ(2, tester.count);
}

// TODO(5921764)
/*
TEST(Timekeeper, onTimeoutPropagates) {
  bool flag = false;
  EXPECT_THROW(
    makeFuture(42).delayed(one_ms)
      .onTimeout(zero_ms, [&]{ flag = true; })
      .get(),
    FutureTimeout);
  EXPECT_TRUE(flag);
}
*/

TEST_F(TimekeeperFixture, atBeforeNow) {
  auto f = timeLord_->at(now() - too_long);
  EXPECT_TRUE(f.isReady());
  EXPECT_FALSE(f.hasException());
}

TEST_F(TimekeeperFixture, howToCastDuration) {
  // I'm not sure whether this rounds up or down but it's irrelevant for the
  // purpose of this example.
  auto f = timeLord_->after(
      std::chrono::duration_cast<Duration>(std::chrono::nanoseconds(1)));
}

TEST_F(TimekeeperFixture, destruction) {
  folly::Optional<ThreadWheelTimekeeper> tk;
  tk.emplace();
  auto f = tk->after(std::chrono::seconds(10));
  EXPECT_FALSE(f.isReady());
  tk.clear();
  EXPECT_TRUE(f.isReady());
  EXPECT_TRUE(f.hasException());
}
