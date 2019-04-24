/*
 * Copyright 2018-present Facebook, Inc.
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
#include <folly/synchronization/DistributedMutex.h>
#include <folly/MapUtil.h>
#include <folly/Synchronized.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <folly/test/DeterministicSchedule.h>

#include <chrono>
#include <thread>

using namespace std::literals;

namespace folly {
namespace test {
/**
 * Like DeterministicSchedule, but allows setting callbacks that can be run
 * for the current thread when an atomic access occurs, and after.  This
 * allows us to construct thread interleavings by hand
 *
 * Constructing a ManualSchedule is required to ensure that we maintain
 * per-test state for threads
 *
 * This can also be used to order thread movement, as an alternative to
 * maintaining condition variables and/or semaphores for the purposes of
 * testing, for example
 *
 *    auto one = std::thread{[&]() {
 *      schedule.wait(1);
 *      two();
 *      schedule.post(2);
 *    }};
 *
 *    auto two = std::thread{[&]() {
 *      one();
 *      schedule.post(1);
 *      schedule.wait(2);
 *      three();
 *    }};
 *
 * The code above is guaranteed to call one(), then two(), and then three()
 */
class ManualSchedule {
 public:
  ManualSchedule() = default;
  ~ManualSchedule() {
    // delete this schedule from the global map
    auto schedules = schedules_.wlock();
    for_each(*schedules, [&](auto& schedule, auto, auto iter) {
      if (schedule.second == this) {
        schedules->erase(iter);
      }
    });
  }

  /**
   * These will be invoked by DeterministicAtomic to signal atomic access
   * before and after the operation
   */
  static void beforeSharedAccess() {
    if (folly::kIsDebug) {
      auto id = std::this_thread::get_id();

      // get the schedule assigned for the current thread, if one exists,
      // otherwise proceed as normal
      auto schedule = get_ptr(*schedules_.wlock(), id);
      if (!schedule) {
        return;
      }

      // now try and get the callbacks for this thread, if there is a callback
      // registered for the test, it must mean that we have a callback
      auto callback = get_ptr((*(*schedule)->callbacks_.wlock()), id);
      if (!callback) {
        return;
      }
      (*callback)();
    }
  }
  static void afterSharedAccess(bool) {
    beforeSharedAccess();
  }

  /**
   * Set a callback that will be called on every subsequent atomic access.
   * This will be invoked before and after every atomic access, for the thread
   * that called setCallback
   */
  void setCallback(std::function<void()> callback) {
    schedules_.wlock()->insert({std::this_thread::get_id(), this});
    callbacks_.wlock()->insert({std::this_thread::get_id(), callback});
  }

  /**
   * Delete the callback set for this thread on atomic accesses
   */
  void removeCallbacks() {
    callbacks_.wlock()->erase(std::this_thread::get_id());
  }

  /**
   * wait() and post() for easy testing
   */
  void wait(int id) {
    if (folly::kIsDebug) {
      auto& baton = (*batons_.wlock())[id];
      baton.wait();
    }
  }
  void post(int id) {
    if (folly::kIsDebug) {
      auto& baton = (*batons_.wlock())[id];
      baton.post();
    }
  }

 private:
  // the map of threads to the schedule started for that test
  static Synchronized<std::unordered_map<std::thread::id, ManualSchedule*>>
      schedules_;
  // the map of callbacks to be executed for a thread's atomic accesses
  Synchronized<std::unordered_map<std::thread::id, std::function<void()>>>
      callbacks_;
  // batons for testing, this map will only ever be written to, so it is safe
  // to hold references outside lock
  Synchronized<std::unordered_map<int, folly::Baton<>>> batons_;
};

Synchronized<std::unordered_map<std::thread::id, ManualSchedule*>>
    ManualSchedule::schedules_;

template <typename T>
using ManualAtomic = test::DeterministicAtomicImpl<T, ManualSchedule>;
template <template <typename> class Atomic>
using TestDistributedMutex =
    detail::distributed_mutex::DistributedMutex<Atomic, false>;

/**
 * Futex extensions for ManualAtomic
 *
 * Note that doing nothing in these should still result in a program that is
 * well defined, since futex wait calls should be tolerant to spurious wakeups
 */
int futexWakeImpl(const detail::Futex<ManualAtomic>*, int, uint32_t) {
  ManualSchedule::beforeSharedAccess();
  return 1;
}
detail::FutexResult futexWaitImpl(
    const detail::Futex<ManualAtomic>*,
    uint32_t,
    std::chrono::system_clock::time_point const*,
    std::chrono::steady_clock::time_point const*,
    uint32_t) {
  ManualSchedule::beforeSharedAccess();
  return detail::FutexResult::AWOKEN;
}

template <typename Clock, typename Duration>
std::cv_status atomic_wait_until(
    const ManualAtomic<std::uintptr_t>*,
    std::uintptr_t,
    const std::chrono::time_point<Clock, Duration>&) {
  ManualSchedule::beforeSharedAccess();
  return std::cv_status::no_timeout;
}

void atomic_notify_one(const ManualAtomic<std::uintptr_t>*) {
  ManualSchedule::beforeSharedAccess();
}
} // namespace test

namespace {
DEFINE_int32(stress_factor, 1000, "The stress test factor for tests");
constexpr auto kForever = 100h;

using DSched = test::DeterministicSchedule;

int sum(int n) {
  return (n * (n + 1)) / 2;
}

template <template <typename> class Atom = std::atomic>
void basicNThreads(int numThreads, int iterations = FLAGS_stress_factor) {
  auto&& mutex = detail::distributed_mutex::DistributedMutex<Atom>{};
  auto&& barrier = std::atomic<int>{0};
  auto&& threads = std::vector<std::thread>{};
  auto&& result = std::vector<int>{};

  auto&& function = [&](auto id) {
    return [&, id] {
      for (auto j = 0; j < iterations; ++j) {
        auto state = mutex.lock();
        EXPECT_EQ(barrier.fetch_add(1, std::memory_order_relaxed), 0);
        result.push_back(id);
        EXPECT_EQ(barrier.fetch_sub(1, std::memory_order_relaxed), 1);
        mutex.unlock(std::move(state));
      }
    };
  };

  for (auto i = 1; i <= numThreads; ++i) {
    threads.push_back(DSched::thread(function(i)));
  }
  for (auto& thread : threads) {
    DSched::join(thread);
  }

  auto total = 0;
  for (auto value : result) {
    total += value;
  }
  EXPECT_EQ(total, sum(numThreads) * iterations);
}
} // namespace

TEST(DistributedMutex, InternalDetailTestOne) {
  auto value = 0;
  auto ptr = reinterpret_cast<std::uintptr_t>(&value);
  EXPECT_EQ(detail::distributed_mutex::extractAddress<int>(ptr), &value);
  ptr = ptr | 0b1;
  EXPECT_EQ(detail::distributed_mutex::extractAddress<int>(ptr), &value);
}

TEST(DistributedMutex, Basic) {
  auto&& mutex = DistributedMutex{};
  auto state = mutex.lock();
  mutex.unlock(std::move(state));
}

TEST(DistributedMutex, BasicTryLock) {
  auto&& mutex = DistributedMutex{};

  while (true) {
    auto state = mutex.try_lock();
    if (state) {
      mutex.unlock(std::move(state));
      break;
    }
  }
}

TEST(DistributedMutex, TestSingleElementContentionChain) {
  using namespace folly::detail;

  // Acquire the mutex once, let another thread form a contention chain on the
  // mutex, and then release it.  Observe the other thread grab the lock
  auto&& schedule = test::ManualSchedule{};
  auto&& mutex = test::TestDistributedMutex<test::ManualAtomic>{};

  auto&& waiter = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(1);
      }
      ++i;
    });

    schedule.wait(0);
    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};

  // lock the mutex, signal the waiter, and then wait till the first thread
  // has gotten on the wait list
  auto state = mutex.lock();
  schedule.post(0);
  schedule.wait(1);

  // release the mutex, and then wait for the waiter to acquire the lock
  mutex.unlock(std::move(state));
  waiter.join();
}

TEST(DistributedMutex, TestTwoElementContentionChain) {
  using namespace folly::detail;

  // Acquire the mutex once, let another thread form a contention chain on the
  // mutex, and then release it.  Observe the other thread grab the lock
  auto&& schedule = test::ManualSchedule{};
  auto&& mutex = test::TestDistributedMutex<test::ManualAtomic>{};

  auto&& one = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(3);
      }
      ++i;
    });

    schedule.wait(0);
    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};

  auto&& two = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(2);
      }
      ++i;
    });

    schedule.wait(1);
    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};

  // lock the mutex, signal the waiter, and then wait till the first thread
  // has gotten on the wait list
  auto state = mutex.lock();
  schedule.post(0);
  schedule.post(1);
  schedule.wait(2);
  schedule.wait(3);

  // release the mutex, and then wait for the waiter to acquire the lock
  mutex.unlock(std::move(state));
  one.join();
  two.join();
}

TEST(DistributedMutex, TestTwoContentionChains) {
  using namespace folly::detail;

  auto&& schedule = test::ManualSchedule{};
  auto&& mutex = test::TestDistributedMutex<test::ManualAtomic>{};

  auto&& one = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(0);
      }
      ++i;
    });

    schedule.wait(1);
    auto state = mutex.lock();
    schedule.wait(4);
    mutex.unlock(std::move(state));
  }};
  auto&& two = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(2);
      }
      ++i;
    });

    schedule.wait(3);
    auto state = mutex.lock();
    schedule.wait(5);
    mutex.unlock(std::move(state));
  }};

  auto state = mutex.lock();
  schedule.post(1);
  schedule.post(3);
  schedule.wait(0);
  schedule.wait(2);

  // at this point there is one contention chain.  Release it
  mutex.unlock(std::move(state));

  // then start a new contention chain
  auto&& three = std::thread{[&]() {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 2) {
        schedule.post(4);
        schedule.post(5);
      }
      ++i;
    });

    auto lockState = mutex.lock();
    schedule.post(6);
    mutex.unlock(std::move(lockState));
  }};

  // wait for the third thread to pick up the lock
  schedule.wait(6);
  one.join();
  two.join();
  three.join();
}

TEST(DistributedMutex, StressTwoThreads) {
  basicNThreads(2);
}
TEST(DistributedMutex, StressThreeThreads) {
  basicNThreads(3);
}
TEST(DistributedMutex, StressFourThreads) {
  basicNThreads(4);
}
TEST(DistributedMutex, StressFiveThreads) {
  basicNThreads(5);
}
TEST(DistributedMutex, StressSixThreads) {
  basicNThreads(6);
}
TEST(DistributedMutex, StressSevenThreads) {
  basicNThreads(7);
}
TEST(DistributedMutex, StressEightThreads) {
  basicNThreads(8);
}
TEST(DistributedMutex, StressSixteenThreads) {
  basicNThreads(16);
}
TEST(DistributedMutex, StressThirtyTwoThreads) {
  basicNThreads(32);
}
TEST(DistributedMutex, StressSixtyFourThreads) {
  basicNThreads(64);
}
TEST(DistributedMutex, StressHundredThreads) {
  basicNThreads(100);
}
TEST(DistributedMutex, StressHardwareConcurrencyThreads) {
  basicNThreads(std::thread::hardware_concurrency());
}

TEST(DistributedMutex, StressTryLock) {
  auto&& mutex = DistributedMutex{};

  for (auto i = 0; i < FLAGS_stress_factor; ++i) {
    while (true) {
      auto state = mutex.try_lock();
      if (state) {
        mutex.unlock(std::move(state));
        break;
      }
    }
  }
}

namespace {
constexpr auto numIterationsDeterministicTest(int threads) {
  if (threads <= 8) {
    return 100;
  }

  return 10;
}

void runBasicNThreadsDeterministic(int threads, int iterations) {
  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    basicNThreads<test::DeterministicAtomic>(threads, iterations);
    static_cast<void>(schedule);
  }
}
} // namespace

TEST(DistributedMutex, DeterministicStressTwoThreads) {
  runBasicNThreadsDeterministic(2, numIterationsDeterministicTest(2));
}
TEST(DistributedMutex, DeterministicStressFourThreads) {
  runBasicNThreadsDeterministic(4, numIterationsDeterministicTest(4));
}
TEST(DistributedMutex, DeterministicStressEightThreads) {
  runBasicNThreadsDeterministic(8, numIterationsDeterministicTest(8));
}
TEST(DistributedMutex, DeterministicStressSixteenThreads) {
  runBasicNThreadsDeterministic(16, numIterationsDeterministicTest(16));
}
TEST(DistributedMutex, DeterministicStressThirtyTwoThreads) {
  runBasicNThreadsDeterministic(32, numIterationsDeterministicTest(32));
}

TEST(DistributedMutex, TimedLockTimeout) {
  auto&& mutex = DistributedMutex{};
  auto&& start = folly::Baton<>{};
  auto&& done = folly::Baton<>{};

  auto thread = std::thread{[&]() {
    auto state = mutex.lock();
    start.post();
    done.wait();
    mutex.unlock(std::move(state));
  }};

  start.wait();
  auto result = mutex.try_lock_for(10ms);
  EXPECT_FALSE(result);
  done.post();
  thread.join();
}

TEST(DistributedMutex, TimedLockAcquireAfterUnlock) {
  auto&& mutex = DistributedMutex{};
  auto&& start = folly::Baton<>{};

  auto thread = std::thread{[&]() {
    auto state = mutex.lock();
    start.post();
    /* sleep override */
    std::this_thread::sleep_for(10ms);
    mutex.unlock(std::move(state));
  }};

  start.wait();
  auto result = mutex.try_lock_for(kForever);
  EXPECT_TRUE(result);
  thread.join();
}

TEST(DistributedMutex, TimedLockAcquireAfterLock) {
  auto&& mutex = test::TestDistributedMutex<test::ManualAtomic>{};
  auto&& schedule = test::ManualSchedule{};

  auto thread = std::thread{[&] {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 1) {
        schedule.post(0);
        schedule.wait(1);
      }

      // when this thread goes into the atomic_notify_one() we let the other
      // thread wake up
      if (i == 3) {
        schedule.post(2);
      }

      ++i;
    });

    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};

  schedule.setCallback([&, i = 0]() mutable {
    // allow the other thread to unlock after the current thread has set the
    // timed waiter state into the mutex
    if (i == 2) {
      schedule.post(1);
      schedule.wait(2);
    }
    ++i;
  });
  schedule.wait(0);
  auto state = mutex.try_lock_for(kForever);
  EXPECT_TRUE(state);
  mutex.unlock(std::move(state));
  thread.join();
}

TEST(DistributedMutex, TimedLockAcquireAfterContentionChain) {
  auto&& mutex = test::TestDistributedMutex<test::ManualAtomic>{};
  auto&& schedule = test::ManualSchedule{};

  auto one = std::thread{[&] {
    schedule.setCallback([&, i = 0]() mutable {
      if (i == 1) {
        schedule.post(0);
        schedule.wait(1);
        schedule.wait(2);
      }
      ++i;
    });

    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};
  auto two = std::thread{[&] {
    schedule.setCallback([&, i = 0]() mutable {
      // block the current thread until the first thread has acquired the
      // lock
      if (i == 0) {
        schedule.wait(0);
      }

      // when the current thread enqueues, let the first thread unlock so we
      // get woken up
      //
      // then wait for the first thread to unlock
      if (i == 2) {
        schedule.post(1);
      }

      ++i;
    });

    auto state = mutex.lock();
    mutex.unlock(std::move(state));
  }};

  // make the current thread wait for the first thread to unlock
  schedule.setCallback([&, i = 0]() mutable {
    // let the first thread unlock after we have enqueued ourselves on the
    // mutex
    if (i == 2) {
      schedule.post(2);
    }
    ++i;
  });
  auto state = mutex.try_lock_for(kForever);
  EXPECT_TRUE(state);
  mutex.unlock(std::move(state));

  one.join();
  two.join();
}

namespace {
template <template <typename> class Atom = std::atomic>
void stressTryLockWithConcurrentLocks(
    int numThreads,
    int iterations = FLAGS_stress_factor) {
  auto&& threads = std::vector<std::thread>{};
  auto&& mutex = detail::distributed_mutex::DistributedMutex<Atom>{};
  auto&& atomic = std::atomic<std::uint64_t>{0};

  for (auto i = 0; i < numThreads; ++i) {
    threads.push_back(DSched::thread([&] {
      for (auto j = 0; j < iterations; ++j) {
        auto state = mutex.lock();
        EXPECT_EQ(atomic.fetch_add(1, std::memory_order_relaxed), 0);
        EXPECT_EQ(atomic.fetch_sub(1, std::memory_order_relaxed), 1);
        mutex.unlock(std::move(state));
      }
    }));
  }

  for (auto i = 0; i < iterations; ++i) {
    if (auto state = mutex.try_lock()) {
      EXPECT_EQ(atomic.fetch_add(1, std::memory_order_relaxed), 0);
      EXPECT_EQ(atomic.fetch_sub(1, std::memory_order_relaxed), 1);
      mutex.unlock(std::move(state));
    }
  }

  for (auto& thread : threads) {
    DSched::join(thread);
  }
}
} // namespace

TEST(DistributedMutex, StressTryLockWithConcurrentLocksTwoThreads) {
  stressTryLockWithConcurrentLocks(2);
}
TEST(DistributedMutex, StressTryLockWithConcurrentLocksFourThreads) {
  stressTryLockWithConcurrentLocks(4);
}
TEST(DistributedMutex, StressTryLockWithConcurrentLocksEightThreads) {
  stressTryLockWithConcurrentLocks(8);
}
TEST(DistributedMutex, StressTryLockWithConcurrentLocksSixteenThreads) {
  stressTryLockWithConcurrentLocks(16);
}
TEST(DistributedMutex, StressTryLockWithConcurrentLocksThirtyTwoThreads) {
  stressTryLockWithConcurrentLocks(32);
}
TEST(DistributedMutex, StressTryLockWithConcurrentLocksSixtyFourThreads) {
  stressTryLockWithConcurrentLocks(64);
}

TEST(DistributedMutex, DeterministicTryLockWithLocksTwoThreads) {
  auto iterations = numIterationsDeterministicTest(2);
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(2, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(2, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockWithFourThreads) {
  auto iterations = numIterationsDeterministicTest(4);
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(4, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(4, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockWithLocksEightThreads) {
  auto iterations = numIterationsDeterministicTest(8);
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(8, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(8, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockWithLocksSixteenThreads) {
  auto iterations = numIterationsDeterministicTest(16);
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(16, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(16, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockWithLocksThirtyTwoThreads) {
  auto iterations = numIterationsDeterministicTest(32);
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(32, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(32, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockWithLocksSixtyFourThreads) {
  stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(64, 5);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    stressTryLockWithConcurrentLocks<test::DeterministicAtomic>(64, 5);
    static_cast<void>(schedule);
  }
}

namespace {
template <template <typename> class Atom = std::atomic>
void concurrentTryLocks(int numThreads, int iterations = FLAGS_stress_factor) {
  auto&& threads = std::vector<std::thread>{};
  auto&& mutex = detail::distributed_mutex::DistributedMutex<Atom>{};
  auto&& atomic = std::atomic<std::uint64_t>{0};

  for (auto i = 0; i < numThreads; ++i) {
    threads.push_back(DSched::thread([&] {
      for (auto j = 0; j < iterations; ++j) {
        if (auto state = mutex.try_lock()) {
          EXPECT_EQ(atomic.fetch_add(1, std::memory_order_relaxed), 0);
          EXPECT_EQ(atomic.fetch_sub(1, std::memory_order_relaxed), 1);
          mutex.unlock(std::move(state));
        }
      }
    }));
  }

  for (auto& thread : threads) {
    DSched::join(thread);
  }
}
} // namespace

TEST(DistributedMutex, StressTryLockWithTwoThreads) {
  concurrentTryLocks(2);
}
TEST(DistributedMutex, StressTryLockFourThreads) {
  concurrentTryLocks(4);
}
TEST(DistributedMutex, StressTryLockEightThreads) {
  concurrentTryLocks(8);
}
TEST(DistributedMutex, StressTryLockSixteenThreads) {
  concurrentTryLocks(16);
}
TEST(DistributedMutex, StressTryLockThirtyTwoThreads) {
  concurrentTryLocks(32);
}
TEST(DistributedMutex, StressTryLockSixtyFourThreads) {
  concurrentTryLocks(64);
}

TEST(DistributedMutex, DeterministicTryLockTwoThreads) {
  auto iterations = numIterationsDeterministicTest(2);
  concurrentTryLocks<test::DeterministicAtomic>(2, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(2, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockFourThreads) {
  auto iterations = numIterationsDeterministicTest(4);
  concurrentTryLocks<test::DeterministicAtomic>(4, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(4, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockEightThreads) {
  auto iterations = numIterationsDeterministicTest(8);
  concurrentTryLocks<test::DeterministicAtomic>(8, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(8, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockSixteenThreads) {
  auto iterations = numIterationsDeterministicTest(16);
  concurrentTryLocks<test::DeterministicAtomic>(16, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(16, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockThirtyTwoThreads) {
  auto iterations = numIterationsDeterministicTest(32);
  concurrentTryLocks<test::DeterministicAtomic>(32, iterations);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(32, iterations);
    static_cast<void>(schedule);
  }
}
TEST(DistributedMutex, DeterministicTryLockSixtyFourThreads) {
  concurrentTryLocks<test::DeterministicAtomic>(64, 5);

  for (auto pass = 0; pass < 3; ++pass) {
    auto&& schedule = DSched{DSched::uniform(pass)};
    concurrentTryLocks<test::DeterministicAtomic>(64, 5);
    static_cast<void>(schedule);
  }
}

} // namespace folly
