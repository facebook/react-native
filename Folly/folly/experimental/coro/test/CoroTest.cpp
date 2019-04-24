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

#include <folly/Portability.h>

#if FOLLY_HAS_COROUTINES

#include <folly/Chrono.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/experimental/coro/BlockingWait.h>
#include <folly/experimental/coro/Future.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <folly/portability/GTest.h>

using namespace folly;

coro::Task<int> task42() {
  co_return 42;
}

TEST(Coro, Basic) {
  ManualExecutor executor;
  auto future = via(&executor, task42());

  EXPECT_FALSE(future.isReady());

  executor.drive();

  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(42, folly::coro::blockingWait(std::move(future)));
}

TEST(Coro, BasicFuture) {
  ManualExecutor executor;

  auto future = via(&executor, task42()).toFuture();

  EXPECT_FALSE(future.isReady());

  EXPECT_EQ(42, future.getVia(&executor));
}

coro::Task<void> taskVoid() {
  (void)co_await task42();
  co_return;
}

TEST(Coro, Basic2) {
  ManualExecutor executor;
  auto future = via(&executor, taskVoid());

  EXPECT_FALSE(future.isReady());

  executor.drive();

  EXPECT_TRUE(future.isReady());
}

coro::Task<void> taskSleep() {
  (void)co_await futures::sleep(std::chrono::seconds{1});
  co_return;
}

TEST(Coro, TaskOfMoveOnly) {
  auto f = []() -> coro::Task<std::unique_ptr<int>> {
    co_return std::make_unique<int>(123);
  };

  auto p = coro::blockingWait(f().scheduleVia(&InlineExecutor::instance()));
  EXPECT_TRUE(p);
  EXPECT_EQ(123, *p);
}

TEST(Coro, Sleep) {
  ScopedEventBaseThread evbThread;

  auto startTime = std::chrono::steady_clock::now();
  auto future = via(evbThread.getEventBase(), taskSleep());

  EXPECT_FALSE(future.isReady());

  coro::blockingWait(std::move(future));

  // The total time should be roughly 1 second. Some builds, especially
  // optimized ones, may result in slightly less than 1 second, so we perform
  // rounding here.
  auto totalTime = std::chrono::steady_clock::now() - startTime;
  EXPECT_GE(
      chrono::round<std::chrono::seconds>(totalTime), std::chrono::seconds{1});
}

coro::Task<int> taskException() {
  throw std::runtime_error("Test exception");
  co_return 42;
}

TEST(Coro, Throw) {
  ManualExecutor executor;
  auto future = via(&executor, taskException());

  EXPECT_FALSE(future.isReady());

  executor.drive();

  EXPECT_TRUE(future.isReady());
  EXPECT_THROW(coro::blockingWait(std::move(future)), std::runtime_error);
}

TEST(Coro, FutureThrow) {
  ManualExecutor executor;
  auto future = via(&executor, taskException()).toFuture();

  EXPECT_FALSE(future.isReady());

  executor.drive();

  EXPECT_TRUE(future.isReady());
  EXPECT_THROW(std::move(future).get(), std::runtime_error);
}

coro::Task<int> taskRecursion(int depth) {
  if (depth > 0) {
    EXPECT_EQ(depth - 1, co_await taskRecursion(depth - 1));
  } else {
    (void)co_await futures::sleep(std::chrono::seconds{1});
  }

  co_return depth;
}

TEST(Coro, LargeStack) {
  ScopedEventBaseThread evbThread;
  auto future = via(evbThread.getEventBase(), taskRecursion(5000));

  EXPECT_EQ(5000, coro::blockingWait(std::move(future)));
}

coro::Task<void> taskThreadNested(std::thread::id threadId) {
  EXPECT_EQ(threadId, std::this_thread::get_id());
  (void)co_await futures::sleep(std::chrono::seconds{1});
  EXPECT_EQ(threadId, std::this_thread::get_id());
  co_return;
}

coro::Task<int> taskThread() {
  auto threadId = std::this_thread::get_id();

  folly::ScopedEventBaseThread evbThread;
  co_await via(
      evbThread.getEventBase(), taskThreadNested(evbThread.getThreadId()));

  EXPECT_EQ(threadId, std::this_thread::get_id());

  co_return 42;
}

TEST(Coro, NestedThreads) {
  ScopedEventBaseThread evbThread;
  auto future = via(evbThread.getEventBase(), taskThread());

  EXPECT_EQ(42, coro::blockingWait(std::move(future)));
}

coro::Task<int> taskYield(Executor* executor) {
  auto currentExecutor = co_await coro::getCurrentExecutor();
  EXPECT_EQ(executor, currentExecutor);

  auto future = via(currentExecutor, task42());
  EXPECT_FALSE(future.isReady());

  co_await coro::yield();

  EXPECT_TRUE(future.isReady());
  co_return co_await std::move(future);
}

TEST(Coro, CurrentExecutor) {
  ScopedEventBaseThread evbThread;
  auto future =
      via(evbThread.getEventBase(), taskYield(evbThread.getEventBase()));

  EXPECT_EQ(42, coro::blockingWait(std::move(future)));
}

coro::Task<void> taskTimedWait() {
  auto fastFuture =
      futures::sleep(std::chrono::milliseconds{50}).thenValue([](Unit) {
        return 42;
      });
  auto fastResult = co_await coro::timed_wait(
      std::move(fastFuture), std::chrono::milliseconds{100});
  EXPECT_TRUE(fastResult);
  EXPECT_EQ(42, *fastResult);

  struct ExpectedException : public std::runtime_error {
    ExpectedException() : std::runtime_error("ExpectedException") {}
  };

  auto throwingFuture =
      futures::sleep(std::chrono::milliseconds{50}).thenValue([](Unit) {
        throw ExpectedException();
      });
  EXPECT_THROW(
      (void)co_await coro::timed_wait(
          std::move(throwingFuture), std::chrono::milliseconds{100}),
      ExpectedException);

  auto slowFuture =
      futures::sleep(std::chrono::milliseconds{200}).thenValue([](Unit) {
        return 42;
      });
  auto slowResult = co_await coro::timed_wait(
      std::move(slowFuture), std::chrono::milliseconds{100});
  EXPECT_FALSE(slowResult);

  co_return;
}

TEST(Coro, TimedWait) {
  ManualExecutor executor;
  via(&executor, taskTimedWait()).toFuture().getVia(&executor);
}

template <int value>
struct AwaitableInt {
  bool await_ready() const {
    return true;
  }

  bool await_suspend(std::experimental::coroutine_handle<>) {
    LOG(FATAL) << "Should never be called.";
  }

  int await_resume() {
    return value;
  }
};

struct AwaitableWithOperator {};

AwaitableInt<42> operator co_await(const AwaitableWithOperator&) {
  return {};
}

coro::Task<int> taskAwaitableWithOperator() {
  co_return co_await AwaitableWithOperator();
}

TEST(Coro, AwaitableWithOperator) {
  ManualExecutor executor;
  EXPECT_EQ(
      42,
      via(&executor, taskAwaitableWithOperator()).toFuture().getVia(&executor));
}

struct AwaitableWithMemberOperator {
  AwaitableInt<42> operator co_await() {
    return {};
  }
};

AwaitableInt<24> operator co_await(const AwaitableWithMemberOperator&) {
  return {};
}

coro::Task<int> taskAwaitableWithMemberOperator() {
  co_return co_await AwaitableWithMemberOperator();
}

TEST(Coro, AwaitableWithMemberOperator) {
  ManualExecutor executor;
  EXPECT_EQ(
      42,
      via(&executor, taskAwaitableWithMemberOperator())
          .toFuture()
          .getVia(&executor));
}

coro::Task<int> taskBaton(fibers::Baton& baton) {
  co_await baton;
  co_return 42;
}

TEST(Coro, Baton) {
  ManualExecutor executor;
  fibers::Baton baton;
  auto future = via(&executor, taskBaton(baton));

  EXPECT_FALSE(future.isReady());

  executor.run();

  EXPECT_FALSE(future.isReady());

  baton.post();
  executor.run();

  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(42, coro::blockingWait(std::move(future)));
}

#endif
