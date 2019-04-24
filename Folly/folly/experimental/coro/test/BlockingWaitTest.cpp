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

#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/experimental/coro/Baton.h>
#include <folly/experimental/coro/BlockingWait.h>
#include <folly/experimental/coro/Utils.h>
#include <folly/fibers/FiberManager.h>
#include <folly/fibers/FiberManagerMap.h>
#include <folly/portability/GTest.h>

#include <memory>
#include <type_traits>

static_assert(
    std::is_same<
        decltype(folly::coro::blockingWait(
            std::declval<folly::coro::AwaitableReady<void>>())),
        void>::value,
    "");
static_assert(
    std::is_same<
        decltype(folly::coro::blockingWait(
            std::declval<folly::coro::AwaitableReady<int>>())),
        int>::value,
    "");
static_assert(
    std::is_same<
        decltype(folly::coro::blockingWait(
            std::declval<folly::coro::AwaitableReady<int&>>())),
        int&>::value,
    "");
static_assert(
    std::is_same<
        decltype(folly::coro::blockingWait(
            std::declval<folly::coro::AwaitableReady<int&&>>())),
        int>::value,
    "blockingWait() should convert rvalue-reference-returning awaitables "
    "into a returned prvalue to avoid potential lifetime issues since "
    "its possible the rvalue reference could have been to some temporary "
    "object stored inside the Awaiter which would have been destructed "
    "by the time blockingWait returns.");

TEST(BlockingWait, SynchronousCompletionVoidResult) {
  folly::coro::blockingWait(folly::coro::AwaitableReady<void>{});
}

TEST(BlockingWait, SynchronousCompletionPRValueResult) {
  EXPECT_EQ(
      123, folly::coro::blockingWait(folly::coro::AwaitableReady<int>{123}));
  EXPECT_EQ(
      "hello",
      folly::coro::blockingWait(
          folly::coro::AwaitableReady<std::string>("hello")));
}

TEST(BlockingWait, SynchronousCompletionLValueResult) {
  int value = 123;
  int& result =
      folly::coro::blockingWait(folly::coro::AwaitableReady<int&>{value});
  EXPECT_EQ(&value, &result);
  EXPECT_EQ(123, result);
}

TEST(BlockingWait, SynchronousCompletionRValueResult) {
  auto p = std::make_unique<int>(123);
  auto* ptr = p.get();

  // Should return a prvalue which will lifetime-extend when assigned to an
  // auto&& local variable.
  auto&& result = folly::coro::blockingWait(
      folly::coro::AwaitableReady<std::unique_ptr<int>&&>{std::move(p)});

  EXPECT_EQ(ptr, result.get());
  EXPECT_FALSE(p);
}

struct TrickyAwaitable {
  struct Awaiter {
    std::unique_ptr<int> value_;

    bool await_ready() const {
      return false;
    }

    bool await_suspend(std::experimental::coroutine_handle<>) {
      value_ = std::make_unique<int>(42);
      return false;
    }

    std::unique_ptr<int>&& await_resume() {
      return std::move(value_);
    }
  };

  Awaiter operator co_await() {
    return {};
  }
};

TEST(BlockingWait, ReturnRvalueReferenceFromAwaiter) {
  // This awaitable stores the result in the temporary Awaiter object that
  // is placed on the coroutine frame as part of the co_await expression.
  // It then returns an rvalue-reference to the value inside this temporary
  // Awaiter object. This test is making sure that we copy/move the result
  // before destructing the Awaiter object.
  auto result = folly::coro::blockingWait(TrickyAwaitable{});
  CHECK(result);
  CHECK_EQ(42, *result);
}

TEST(BlockingWait, AsynchronousCompletionOnAnotherThread) {
  folly::coro::Baton baton;
  std::thread t{[&] { baton.post(); }};
  SCOPE_EXIT {
    t.join();
  };
  folly::coro::blockingWait(baton);
}

template <typename T>
class SimplePromise {
 public:
  class WaitOperation {
   public:
    explicit WaitOperation(
        folly::coro::Baton& baton,
        folly::Optional<T>& value) noexcept
        : awaiter_(baton), value_(value) {}

    bool await_ready() {
      return awaiter_.await_ready();
    }

    template <typename Promise>
    auto await_suspend(std::experimental::coroutine_handle<Promise> h) {
      return awaiter_.await_suspend(h);
    }

    T&& await_resume() {
      awaiter_.await_resume();
      return std::move(*value_);
    }

   private:
    folly::coro::Baton::WaitOperation awaiter_;
    folly::Optional<T>& value_;
  };

  SimplePromise() = default;

  WaitOperation operator co_await() {
    return WaitOperation{baton_, value_};
  }

  template <typename... Args>
  void emplace(Args&&... args) {
    value_.emplace(static_cast<Args&&>(args)...);
    baton_.post();
  }

 private:
  folly::coro::Baton baton_;
  folly::Optional<T> value_;
};

TEST(BlockingWait, WaitOnSimpleAsyncPromise) {
  SimplePromise<std::string> p;
  std::thread t{[&] { p.emplace("hello coroutines!"); }};
  SCOPE_EXIT {
    t.join();
  };
  auto result = folly::coro::blockingWait(p);
  EXPECT_EQ("hello coroutines!", result);
}

struct MoveCounting {
  int count_;
  MoveCounting() noexcept : count_(0) {}
  MoveCounting(MoveCounting&& other) noexcept : count_(other.count_ + 1) {}
  MoveCounting& operator=(MoveCounting&& other) = delete;
};

TEST(BlockingWait, WaitOnMoveOnlyAsyncPromise) {
  SimplePromise<MoveCounting> p;
  std::thread t{[&] { p.emplace(); }};
  SCOPE_EXIT {
    t.join();
  };
  auto result = folly::coro::blockingWait(p);

  // Number of move-constructions:
  // 0. Value is in-place constructed in Optional<T>
  // 0. await_resume() returns rvalue reference to Optional<T> value.
  // 1. return_value() moves value into Try<T>
  // 2. Value is moved from Try<T> to blockingWait() return value.
  EXPECT_GE(2, result.count_);
}

TEST(BlockingWait, moveCountingAwaitableReady) {
  folly::coro::AwaitableReady<MoveCounting> awaitable{MoveCounting{}};
  auto result = folly::coro::blockingWait(awaitable);

  // Moves:
  // 1. Move value into AwaitableReady
  // 2. Move value to await_resume() return-value
  // 3. Move value to Try<T>
  // 4. Move value to blockingWait() return-value
  EXPECT_GE(4, result.count_);
}

TEST(BlockingWait, WaitInFiber) {
  SimplePromise<int> promise;
  folly::EventBase evb;
  auto& fm = folly::fibers::getFiberManager(evb);

  auto future =
      fm.addTaskFuture([&] { return folly::coro::blockingWait(promise); });

  evb.loopOnce();
  EXPECT_FALSE(future.isReady());

  promise.emplace(42);

  evb.loopOnce();
  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(42, std::move(future).get());
}

#endif
