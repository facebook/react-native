/*
 * Copyright 2015-present Facebook, Inc.
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

#include <queue>

#include <folly/executors/InlineExecutor.h>
#include <folly/futures/Future.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

using namespace folly;
using std::vector;
using std::chrono::milliseconds;

TEST(Wait, waitImmediate) {
  makeFuture().wait();
  auto done = makeFuture(42).wait().value();
  EXPECT_EQ(42, done);

  vector<int> v{1, 2, 3};
  auto done_v = makeFuture(v).wait().value();
  EXPECT_EQ(v.size(), done_v.size());
  EXPECT_EQ(v, done_v);

  vector<Future<Unit>> v_f;
  v_f.push_back(makeFuture());
  v_f.push_back(makeFuture());
  auto done_v_f = collectAllSemiFuture(v_f).toUnsafeFuture().wait().value();
  EXPECT_EQ(2, done_v_f.size());

  vector<Future<bool>> v_fb;
  v_fb.push_back(makeFuture(true));
  v_fb.push_back(makeFuture(false));
  auto fut = collectAll(v_fb);
  auto done_v_fb = std::move(fut.wait().value());
  EXPECT_EQ(2, done_v_fb.size());
}

TEST(Wait, wait) {
  Promise<int> p;
  Future<int> f = p.getFuture();
  std::atomic<bool> flag{false};
  std::atomic<int> result{1};
  std::atomic<std::thread::id> id;

  std::thread th(
      [&](Future<int>&& tf) {
        auto n = std::move(tf).thenTry([&](Try<int>&& t) {
          id = std::this_thread::get_id();
          return t.value();
        });
        flag = true;
        result.store(n.wait().value());
      },
      std::move(f));
  while (!flag) {
  }
  EXPECT_EQ(result.load(), 1);
  p.setValue(42);
  th.join();
  // validate that the callback ended up executing in this thread, which
  // is more to ensure that this test actually tests what it should
  EXPECT_EQ(id, std::this_thread::get_id());
  EXPECT_EQ(result.load(), 42);
}

struct MoveFlag {
  MoveFlag() = default;
  MoveFlag& operator=(const MoveFlag&) = delete;
  MoveFlag(const MoveFlag&) = delete;
  MoveFlag(MoveFlag&& other) noexcept {
    other.moved = true;
  }
  bool moved{false};
};

TEST(Wait, waitReplacesSelf) {
  // wait
  {
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.wait();
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).wait();
    EXPECT_FALSE(f2.value().moved);
  }

  // wait(Duration)
  {
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.wait(milliseconds(1));
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).wait(milliseconds(1));
    EXPECT_FALSE(f2.value().moved);
  }

  // waitVia
  {
    folly::EventBase eb;
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.waitVia(&eb);
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).waitVia(&eb);
    EXPECT_FALSE(f2.value().moved);
  }
}

TEST(Wait, waitWithDuration) {
  {
    Promise<int> p;
    Future<int> f = p.getFuture();
    f.wait(milliseconds(1));
    EXPECT_FALSE(f.isReady());
    p.setValue(1);
    EXPECT_TRUE(f.isReady());
  }
  {
    Promise<int> p;
    Future<int> f = p.getFuture();
    p.setValue(1);
    f.wait(milliseconds(1));
    EXPECT_TRUE(f.isReady());
  }
  {
    vector<Future<bool>> v_fb;
    v_fb.push_back(makeFuture(true));
    v_fb.push_back(makeFuture(false));
    auto f = collectAll(v_fb);
    f.wait(milliseconds(1));
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(2, f.value().size());
  }
  {
    vector<Future<bool>> v_fb;
    Promise<bool> p1;
    Promise<bool> p2;
    v_fb.push_back(p1.getFuture());
    v_fb.push_back(p2.getFuture());
    auto f = collectAll(v_fb);
    f.wait(milliseconds(1));
    EXPECT_FALSE(f.isReady());
    p1.setValue(true);
    EXPECT_FALSE(f.isReady());
    p2.setValue(true);
    EXPECT_TRUE(f.isReady());
  }
  {
    auto f = makeFuture().wait(milliseconds(1));
    EXPECT_TRUE(f.isReady());
  }

  {
    Promise<Unit> p;
    auto start = std::chrono::steady_clock::now();
    auto f = p.getFuture().wait(milliseconds(100));
    auto elapsed = std::chrono::steady_clock::now() - start;
    EXPECT_GE(elapsed, milliseconds(100));
    EXPECT_FALSE(f.isReady());
    p.setValue();
    EXPECT_TRUE(f.isReady());
  }

  {
    // Try to trigger the race where the resultant Future is not yet complete
    // even if we didn't hit the timeout, and make sure we deal with it properly
    Promise<Unit> p;
    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue();
    });
    b.wait();
    auto f = p.getFuture().wait(std::chrono::seconds(3600));
    EXPECT_TRUE(f.isReady());
    t.join();
  }

  {
    // `Future::wait(Duration) &` when promise is fulfilled during the wait
    Promise<int> p;

    auto f = p.getFuture();
    EXPECT_FALSE(f.isReady());

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    f.wait(std::chrono::seconds(10));
    EXPECT_TRUE(f.valid());
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(f.value(), 42);

    t.join();
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(f.value(), 42);
  }

  {
    // `Future::wait(Duration) &&` when promise is fulfilled during the wait
    Promise<int> p;

    auto f1 = p.getFuture();
    EXPECT_FALSE(f1.isReady());

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    auto f2 = std::move(f1).wait(std::chrono::seconds(10));
    EXPECT_FALSE(f1.valid());
    EXPECT_TRUE(f2.valid());
    EXPECT_TRUE(f2.isReady());
    EXPECT_EQ(f2.value(), 42);

    t.join();
    EXPECT_TRUE(f2.valid());
    EXPECT_TRUE(f2.isReady());
    EXPECT_EQ(f2.value(), 42);
  }

  {
    // `SemiFuture::get(Duration) &&` when promise is fulfilled during the get
    Promise<int> p;

    auto f = p.getSemiFuture();
    EXPECT_FALSE(f.isReady());

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    EXPECT_EQ(std::move(f).get(std::chrono::seconds(10)), 42);

    t.join();
  }
}

TEST(Wait, multipleWait) {
  auto f = futures::sleep(milliseconds(100));
  for (size_t i = 0; i < 5; ++i) {
    EXPECT_FALSE(f.isReady());
    f.wait(milliseconds(3));
  }
  EXPECT_FALSE(f.isReady());
  f.wait();
  EXPECT_TRUE(f.isReady());
  f.wait();
  EXPECT_TRUE(f.isReady());
}

TEST(Wait, WaitPlusThen) {
  // Validate expected behavior of `f.wait(...).then([](auto&){...})`.
  // There are 10 sub-cases:
  //   - Future fulfilled {prior to, during} call to wait().
  //   - Future fulfilled {prior to, during, after} call to wait(dur).
  //   - then repeat those 5 cases for SemiFuture

  {
    // Sub-case: Future fulfilled before `wait()` is called.
    // Expect call to `.then()` to succeed & continuation to run immediately.
    Promise<int> p;
    auto f = p.getFuture();
    p.setValue(42);
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(f.value(), 42);
    f.wait();
    auto continuation = 0;
    EXPECT_NO_THROW(
        std::move(f).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
  }

  {
    // Sub-case: Future fulfilled after `wait()` actually has to wait.
    // Expect call to `.then()` to fail (throw std::logic_error).
    Promise<int> p;
    auto f = p.getFuture();

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    EXPECT_FALSE(f.isReady()); // deterministically passes in practice
    f.wait();
    EXPECT_TRUE(f.isReady());
    auto continuation = 0;
    EXPECT_NO_THROW(
        std::move(f).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
    t.join();
  }

  {
    // Sub-case: Future fulfilled before `wait(dur)` is called.
    // Expect call to `.then()` to succeed & continuation to run immediately.
    Promise<int> p;
    auto f = p.getFuture();
    p.setValue(42);
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(f.value(), 42);
    f.wait(std::chrono::seconds(10));
    auto continuation = 0;
    EXPECT_NO_THROW(
        std::move(f).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
  }

  {
    // Sub-case: Future fulfilled after `wait(dur)` actually starts waiting.
    // Expect call to `.then()` to succeed & continuation to when result ready.
    Promise<int> p;
    auto f = p.getFuture();

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    EXPECT_FALSE(f.isReady()); // deterministically passes in practice
    f.wait(std::chrono::seconds(10));
    EXPECT_TRUE(f.isReady()); // deterministically passes in practice
    auto continuation = 0;
    EXPECT_NO_THROW(
        std::move(f).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
    t.join();
  }

  {
    // Sub-case: Future not fulfilled - `wait(dur)` times out.
    // Expect call to `.then()` to succeed; continuation to not run.
    Promise<int> p;
    auto f = p.getFuture();
    f.wait(milliseconds(1));
    auto continuation = 0;
    EXPECT_NO_THROW(
        std::move(f).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 0);
  }

  {
    // Sub-case: SemiFuture fulfilled before `wait()` is called.
    // Expect call to `.then()` to succeed & continuation to run immediately.
    Promise<int> p;
    auto f = p.getSemiFuture();
    p.setValue(42);
    EXPECT_TRUE(f.isReady());
    EXPECT_EQ(f.value(), 42);
    f.wait();
    auto continuation = 0;
    InlineExecutor e;
    auto f2 = std::move(f).via(&e);
    EXPECT_NO_THROW(
        std::move(f2).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
  }

  {
    // Sub-case: SemiFuture fulfilled after `wait()` actually has to wait.
    // Expect call to `.then()` to fail (throw std::logic_error).
    Promise<int> p;
    auto f = p.getSemiFuture();

    folly::Baton<> b;
    auto t = std::thread([&] {
      b.post();
      /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
      p.setValue(42);
    });
    b.wait();

    EXPECT_FALSE(f.isReady()); // deterministically passes in practice
    f.wait();
    EXPECT_TRUE(f.isReady());
    auto continuation = 0;
    InlineExecutor e;
    auto f2 = std::move(f).via(&e);
    EXPECT_NO_THROW(
        std::move(f2).thenValue([&](auto&& v) { continuation = v; }));
    EXPECT_EQ(continuation, 42);
    t.join();
  }
}
