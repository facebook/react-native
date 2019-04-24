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

#include <folly/executors/CPUThreadPoolExecutor.h>
#include <folly/executors/InlineExecutor.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/experimental/coro/Baton.h>
#include <folly/experimental/coro/BlockingWait.h>
#include <folly/experimental/coro/Future.h>
#include <folly/experimental/coro/Mutex.h>
#include <folly/experimental/coro/Promise.h>
#include <folly/experimental/coro/Task.h>
#include <folly/experimental/coro/detail/InlineTask.h>
#include <folly/portability/GTest.h>

#include <mutex>

using namespace folly;

TEST(Mutex, TryLock) {
  coro::Mutex m;
  CHECK(m.try_lock());
  CHECK(!m.try_lock());
  m.unlock();
  CHECK(m.try_lock());
}

TEST(Mutex, ScopedLock) {
  coro::Mutex m;
  {
    std::unique_lock<coro::Mutex> lock{m, std::try_to_lock};
    CHECK(lock.owns_lock());

    {
      std::unique_lock<coro::Mutex> lock2{m, std::try_to_lock};
      CHECK(!lock2.owns_lock());
    }
  }

  CHECK(m.try_lock());
  m.unlock();
}

TEST(Mutex, LockAsync) {
  coro::Mutex m;
  coro::Baton b1;
  coro::Baton b2;

  int value = 0;

  auto makeTask = [&](coro::Baton& b) -> coro::Task<void> {
    co_await m.co_lock();
    ++value;
    co_await b;
    ++value;
    m.unlock();
  };

  auto& inlineExecutor = InlineExecutor::instance();

  auto f1 = makeTask(b1).scheduleVia(&inlineExecutor);
  CHECK_EQ(1, value);
  CHECK(!m.try_lock());

  auto f2 = makeTask(b2).scheduleVia(&inlineExecutor);
  CHECK_EQ(1, value);

  // This will resume f1 coroutine and let it release the
  // lock. This will in turn resume f2 which was suspended
  // at co_await m.lockAsync() which will then increment the value
  // before becoming blocked on
  b1.post();

  CHECK_EQ(3, value);
  CHECK(!m.try_lock());

  b2.post();
  CHECK_EQ(4, value);
  CHECK(m.try_lock());
}

TEST(Mutex, ScopedLockAsync) {
  coro::Mutex m;
  coro::Baton b1;
  coro::Baton b2;

  int value = 0;

  auto makeTask = [&](coro::Baton& b) -> coro::Task<void> {
    auto lock = co_await m.co_scoped_lock();
    ++value;
    co_await b;
    ++value;
  };

  auto& inlineExecutor = InlineExecutor::instance();

  auto f1 = makeTask(b1).scheduleVia(&inlineExecutor);
  CHECK_EQ(1, value);
  CHECK(!m.try_lock());

  auto f2 = makeTask(b2).scheduleVia(&inlineExecutor);
  CHECK_EQ(1, value);

  // This will resume f1 coroutine and let it release the
  // lock. This will in turn resume f2 which was suspended
  // at co_await m.lockAsync() which will then increment the value
  // before becoming blocked on b2.
  b1.post();

  CHECK_EQ(3, value);
  CHECK(!m.try_lock());

  b2.post();
  CHECK_EQ(4, value);
  CHECK(m.try_lock());
}

TEST(Mutex, ThreadSafety) {
  CPUThreadPoolExecutor threadPool{
      2, std::make_shared<NamedThreadFactory>("CPUThreadPool")};

  int value = 0;
  coro::Mutex mutex;

  auto makeTask = [&]() -> coro::Task<void> {
    for (int i = 0; i < 10'000; ++i) {
      auto lock = co_await mutex.co_scoped_lock();
      ++value;
    }
  };

  auto f1 = makeTask().scheduleVia(&threadPool);
  auto f2 = makeTask().scheduleVia(&threadPool);
  auto f3 = makeTask().scheduleVia(&threadPool);

  coro::blockingWait(std::move(f1));
  coro::blockingWait(std::move(f2));
  coro::blockingWait(std::move(f3));

  CHECK_EQ(30'000, value);
}

TEST(Mutex, InlineTaskDeadlock) {
  coro::Mutex coroMutex;
  std::timed_mutex stdMutex;

  std::thread thread1([&] {
    coro::blockingWait(
        [](auto& coroMutex, auto& stdMutex) -> coro::detail::InlineTask<void> {
          co_await coroMutex.co_lock();
          std::this_thread::sleep_for(std::chrono::milliseconds{200});
          stdMutex.lock();
          // At this point the other coroutine is suspended waiting on
          // coroMutex.co_lock(). coroMutex.unlock() will unlock the mutex and
          // run the other coroutine *inline*. That coroutine will
          // try to acquire stdMutex resulting in a deadlock.
          coroMutex.unlock();
          stdMutex.unlock();
        }(coroMutex, stdMutex));
  });

  std::thread thread2([&] {
    coro::blockingWait(
        [](auto& coroMutex, auto& stdMutex) -> coro::detail::InlineTask<void> {
          std::this_thread::sleep_for(std::chrono::milliseconds{100});
          co_await coroMutex.co_lock();
          EXPECT_FALSE(stdMutex.try_lock_for(std::chrono::milliseconds{500}));
          coroMutex.unlock();
        }(coroMutex, stdMutex));
  });

  thread1.join();
  thread2.join();
}

#endif
