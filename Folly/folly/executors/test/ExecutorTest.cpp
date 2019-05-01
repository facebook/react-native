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

#include <folly/executors/InlineExecutor.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

// TODO(jsedgwick) move this test to executors/test/ once the tested executors
// have all moved

using namespace folly;

TEST(ManualExecutor, runIsStable) {
  ManualExecutor x;
  size_t count = 0;
  auto f1 = [&]() { count++; };
  auto f2 = [&]() {
    x.add(f1);
    x.add(f1);
  };
  x.add(f2);
  x.run();
  EXPECT_EQ(count, 0);

  // ManualExecutor's destructor drains, so explicitly clear the two added by
  // f2.
  EXPECT_EQ(2, x.clear());
}

TEST(ManualExecutor, drainIsNotStable) {
  ManualExecutor x;
  size_t count = 0;
  auto f1 = [&]() { count++; };
  auto f2 = [&]() {
    x.add(f1);
    x.add(f1);
  };
  x.add(f2);
  x.drain();
  EXPECT_EQ(count, 2);
}

TEST(ManualExecutor, scheduleDur) {
  ManualExecutor x;
  size_t count = 0;
  std::chrono::milliseconds dur{10};
  x.schedule([&] { count++; }, dur);
  EXPECT_EQ(count, 0);
  x.run();
  EXPECT_EQ(count, 0);
  x.advance(dur / 2);
  EXPECT_EQ(count, 0);
  x.advance(dur / 2);
  EXPECT_EQ(count, 1);
}

TEST(ManualExecutor, laterThingsDontBlockEarlierOnes) {
  ManualExecutor x;
  auto first = false;
  std::chrono::milliseconds dur{10};
  x.schedule([&] { first = true; }, dur);
  x.schedule([] {}, 2 * dur);
  EXPECT_FALSE(first);
  x.advance(dur);
  EXPECT_TRUE(first);
}

TEST(ManualExecutor, orderWillNotBeQuestioned) {
  ManualExecutor x;
  auto first = false;
  auto second = false;
  std::chrono::milliseconds dur{10};
  x.schedule([&] { first = true; }, dur);
  x.schedule([&] { second = true; }, 2 * dur);
  EXPECT_FALSE(first);
  EXPECT_FALSE(second);
  x.advance(dur);
  EXPECT_TRUE(first);
  EXPECT_FALSE(second);
  x.advance(dur);
  EXPECT_TRUE(first);
  EXPECT_TRUE(second);
}

TEST(ManualExecutor, evenWhenYouSkipAheadEventsRunInProperOrder) {
  ManualExecutor x;
  auto counter = 0;
  auto first = 0;
  auto second = 0;
  std::chrono::milliseconds dur{10};
  x.schedule([&] { first = ++counter; }, dur);
  x.schedule([&] { second = ++counter; }, 2 * dur);
  EXPECT_EQ(first, 0);
  EXPECT_EQ(second, 0);
  x.advance(3 * dur);
  EXPECT_EQ(first, 1);
  EXPECT_EQ(second, 2);
}

TEST(ManualExecutor, clockStartsAt0) {
  ManualExecutor x;
  EXPECT_EQ(x.now(), x.now().min());
}

TEST(ManualExecutor, scheduleAbs) {
  ManualExecutor x;
  size_t count = 0;
  x.scheduleAt([&] { count++; }, x.now() + std::chrono::milliseconds(10));
  EXPECT_EQ(count, 0);
  x.advance(std::chrono::milliseconds(10));
  EXPECT_EQ(count, 1);
}

TEST(ManualExecutor, advanceTo) {
  ManualExecutor x;
  size_t count = 0;
  x.scheduleAt([&] { count++; }, std::chrono::steady_clock::now());
  EXPECT_EQ(count, 0);
  x.advanceTo(std::chrono::steady_clock::now());
  EXPECT_EQ(count, 1);
}

TEST(ManualExecutor, advanceBack) {
  ManualExecutor x;
  size_t count = 0;
  x.advance(std::chrono::microseconds(5));
  x.schedule([&] { count++; }, std::chrono::microseconds(6));
  EXPECT_EQ(count, 0);
  x.advanceTo(x.now() - std::chrono::microseconds(1));
  EXPECT_EQ(count, 0);
}

TEST(ManualExecutor, advanceNeg) {
  ManualExecutor x;
  size_t count = 0;
  x.advance(std::chrono::microseconds(5));
  x.schedule([&] { count++; }, std::chrono::microseconds(6));
  EXPECT_EQ(count, 0);
  x.advance(std::chrono::microseconds(-1));
  EXPECT_EQ(count, 0);
}

TEST(ManualExecutor, waitForDoesNotDeadlock) {
  ManualExecutor east, west;
  folly::Baton<> baton;
  auto f = makeFuture()
               .via(&east)
               .then([](Try<Unit>) { return makeFuture(); })
               .via(&west);
  std::thread t([&] {
    baton.post();
    west.waitFor(f);
  });
  baton.wait();
  east.run();
  t.join();
}

TEST(ManualExecutor, getViaDoesNotDeadlock) {
  ManualExecutor east, west;
  folly::Baton<> baton;
  auto f = makeFuture()
               .via(&east)
               .then([](Try<Unit>) { return makeFuture(); })
               .via(&west);
  std::thread t([&] {
    baton.post();
    f.getVia(&west);
  });
  baton.wait();
  east.run();
  t.join();
}

TEST(ManualExecutor, clear) {
  ManualExecutor x;
  size_t count = 0;
  x.add([&] { ++count; });
  x.scheduleAt([&] { ++count; }, x.now() + std::chrono::milliseconds(10));
  EXPECT_EQ(0, count);

  x.clear();
  x.advance(std::chrono::milliseconds(10));
  x.run();
  EXPECT_EQ(0, count);
}

TEST(ManualExecutor, drainsOnDestruction) {
  size_t count = 0;
  {
    ManualExecutor x;
    x.add([&] { ++count; });
  }
  EXPECT_EQ(1, count);
}

TEST(Executor, InlineExecutor) {
  InlineExecutor x;
  size_t counter = 0;
  x.add([&] {
    x.add([&] {
      EXPECT_EQ(counter, 0);
      counter++;
    });
    EXPECT_EQ(counter, 1);
    counter++;
  });
  EXPECT_EQ(counter, 2);
}

TEST(Executor, QueuedImmediateExecutor) {
  QueuedImmediateExecutor x;
  size_t counter = 0;
  x.add([&] {
    x.add([&] {
      EXPECT_EQ(1, counter);
      counter++;
    });
    EXPECT_EQ(0, counter);
    counter++;
  });
  EXPECT_EQ(2, counter);
}

TEST(Executor, Runnable) {
  InlineExecutor x;
  size_t counter = 0;
  struct Runnable {
    std::function<void()> fn;
    void operator()() {
      fn();
    }
  };
  Runnable f;
  f.fn = [&] { counter++; };
  x.add(f);
  EXPECT_EQ(counter, 1);
}

TEST(Executor, ThrowableThen) {
  InlineExecutor x;
  auto f = Future<Unit>().thenValue(
      [](auto&&) { throw std::runtime_error("Faildog"); });

  /*
  auto f = Future<Unit>().via(&x).then([](){
    throw std::runtime_error("Faildog");
  });*/
  EXPECT_THROW(f.value(), std::exception);
}

class CrappyExecutor : public Executor {
 public:
  void add(Func /* f */) override {
    throw std::runtime_error("bad");
  }
};

TEST(Executor, CrappyExecutor) {
  CrappyExecutor x;
  bool flag = false;
  auto f = folly::via(&x).onError([&](std::runtime_error& e) {
    EXPECT_STREQ("bad", e.what());
    flag = true;
  });
  EXPECT_TRUE(flag);
}

class DoNothingExecutor : public Executor {
 public:
  void add(Func f) override {
    storedFunc_ = std::move(f);
  }

 private:
  Func storedFunc_;
};

TEST(Executor, DoNothingExecutor) {
  DoNothingExecutor x;

  // Submit future callback to DoNothingExecutor
  auto f = folly::via(&x).thenValue([](auto&&) { return 42; });

  // Callback function is stored in DoNothingExecutor, but not executed.
  EXPECT_FALSE(f.isReady());

  // Destroy the function stored in DoNothingExecutor. The future callback
  // will never get executed.
  x.add({});

  EXPECT_TRUE(f.isReady());
  EXPECT_THROW(std::move(f).get(), folly::BrokenPromise);
}
