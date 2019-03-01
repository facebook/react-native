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

#include <folly/SharedMutex.h>

#include <stdlib.h>
#include <thread>
#include <vector>

#include <boost/optional.hpp>
#include <boost/thread/shared_mutex.hpp>

#include <folly/Benchmark.h>
#include <folly/MPMCQueue.h>
#include <folly/RWSpinLock.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

using namespace folly;
using namespace folly::test;
using namespace std;
using namespace chrono;

typedef DeterministicSchedule DSched;
typedef SharedMutexImpl<true, void, DeterministicAtomic, true>
    DSharedMutexReadPriority;
typedef SharedMutexImpl<false, void, DeterministicAtomic, true>
    DSharedMutexWritePriority;

template <typename Lock>
void runBasicTest() {
  Lock lock;
  SharedMutexToken token1;
  SharedMutexToken token2;
  SharedMutexToken token3;

  EXPECT_TRUE(lock.try_lock());
  EXPECT_FALSE(lock.try_lock());
  EXPECT_FALSE(lock.try_lock_shared(token1));
  lock.unlock();

  EXPECT_TRUE(lock.try_lock_shared(token1));
  EXPECT_FALSE(lock.try_lock());
  EXPECT_TRUE(lock.try_lock_shared(token2));
  lock.lock_shared(token3);
  lock.unlock_shared(token3);
  lock.unlock_shared(token2);
  lock.unlock_shared(token1);

  lock.lock();
  lock.unlock();

  lock.lock_shared(token1);
  lock.lock_shared(token2);
  lock.unlock_shared(token1);
  lock.unlock_shared(token2);

  lock.lock();
  lock.unlock_and_lock_shared(token1);
  lock.lock_shared(token2);
  lock.unlock_shared(token2);
  lock.unlock_shared(token1);
}

TEST(SharedMutex, basic) {
  runBasicTest<SharedMutexReadPriority>();
  runBasicTest<SharedMutexWritePriority>();
}

template <typename Lock>
void runBasicHoldersTest() {
  Lock lock;
  SharedMutexToken token;

  {
    // create an exclusive write lock via holder
    typename Lock::WriteHolder holder(lock);
    EXPECT_FALSE(lock.try_lock());
    EXPECT_FALSE(lock.try_lock_shared(token));

    // move ownership to another write holder via move constructor
    typename Lock::WriteHolder holder2(std::move(holder));
    EXPECT_FALSE(lock.try_lock());
    EXPECT_FALSE(lock.try_lock_shared(token));

    // move ownership to another write holder via assign operator
    typename Lock::WriteHolder holder3;
    holder3 = std::move(holder2);
    EXPECT_FALSE(lock.try_lock());
    EXPECT_FALSE(lock.try_lock_shared(token));

    // downgrade from exclusive to upgrade lock via move constructor
    typename Lock::UpgradeHolder holder4(std::move(holder3));

    // ensure we can lock from a shared source
    EXPECT_FALSE(lock.try_lock());
    EXPECT_TRUE(lock.try_lock_shared(token));
    lock.unlock_shared(token);

    // promote from upgrade to exclusive lock via move constructor
    typename Lock::WriteHolder holder5(std::move(holder4));
    EXPECT_FALSE(lock.try_lock());
    EXPECT_FALSE(lock.try_lock_shared(token));

    // downgrade exclusive to shared lock via move constructor
    typename Lock::ReadHolder holder6(std::move(holder5));

    // ensure we can lock from another shared source
    EXPECT_FALSE(lock.try_lock());
    EXPECT_TRUE(lock.try_lock_shared(token));
    lock.unlock_shared(token);
  }

  {
    typename Lock::WriteHolder holder(lock);
    EXPECT_FALSE(lock.try_lock());
  }

  {
    typename Lock::ReadHolder holder(lock);
    typename Lock::ReadHolder holder2(lock);
    typename Lock::UpgradeHolder holder3(lock);
  }

  {
    typename Lock::UpgradeHolder holder(lock);
    typename Lock::ReadHolder holder2(lock);
    typename Lock::ReadHolder holder3(std::move(holder));
  }
}

TEST(SharedMutex, basic_holders) {
  runBasicHoldersTest<SharedMutexReadPriority>();
  runBasicHoldersTest<SharedMutexWritePriority>();
}

template <typename Lock>
void runManyReadLocksTestWithTokens() {
  Lock lock;

  vector<SharedMutexToken> tokens;
  for (int i = 0; i < 1000; ++i) {
    tokens.emplace_back();
    EXPECT_TRUE(lock.try_lock_shared(tokens.back()));
  }
  for (auto& token : tokens) {
    lock.unlock_shared(token);
  }
  EXPECT_TRUE(lock.try_lock());
  lock.unlock();
}

TEST(SharedMutex, many_read_locks_with_tokens) {
  runManyReadLocksTestWithTokens<SharedMutexReadPriority>();
  runManyReadLocksTestWithTokens<SharedMutexWritePriority>();
}

template <typename Lock>
void runManyReadLocksTestWithoutTokens() {
  Lock lock;

  for (int i = 0; i < 1000; ++i) {
    EXPECT_TRUE(lock.try_lock_shared());
  }
  for (int i = 0; i < 1000; ++i) {
    lock.unlock_shared();
  }
  EXPECT_TRUE(lock.try_lock());
  lock.unlock();
}

TEST(SharedMutex, many_read_locks_without_tokens) {
  runManyReadLocksTestWithoutTokens<SharedMutexReadPriority>();
  runManyReadLocksTestWithoutTokens<SharedMutexWritePriority>();
}

template <typename Lock>
void runTimeoutInPastTest() {
  Lock lock;

  EXPECT_TRUE(lock.try_lock_for(milliseconds(0)));
  lock.unlock();
  EXPECT_TRUE(lock.try_lock_for(milliseconds(-1)));
  lock.unlock();
  EXPECT_TRUE(lock.try_lock_shared_for(milliseconds(0)));
  lock.unlock_shared();
  EXPECT_TRUE(lock.try_lock_shared_for(milliseconds(-1)));
  lock.unlock_shared();
  EXPECT_TRUE(lock.try_lock_until(system_clock::now() - milliseconds(1)));
  lock.unlock();
  EXPECT_TRUE(
      lock.try_lock_shared_until(system_clock::now() - milliseconds(1)));
  lock.unlock_shared();
  EXPECT_TRUE(lock.try_lock_until(steady_clock::now() - milliseconds(1)));
  lock.unlock();
  EXPECT_TRUE(
      lock.try_lock_shared_until(steady_clock::now() - milliseconds(1)));
  lock.unlock_shared();
}

TEST(SharedMutex, timeout_in_past) {
  runTimeoutInPastTest<SharedMutexReadPriority>();
  runTimeoutInPastTest<SharedMutexWritePriority>();
}

template <class Func>
bool funcHasDuration(milliseconds expectedDuration, Func func) {
  // elapsed time should eventually fall within expectedDuration +- 25%
  for (int tries = 0; tries < 100; ++tries) {
    auto start = steady_clock::now();
    func();
    auto elapsed = steady_clock::now() - start;
    if (elapsed > expectedDuration - expectedDuration / 4 &&
        elapsed < expectedDuration + expectedDuration / 4) {
      return true;
    }
  }
  return false;
}

template <typename Lock>
void runFailingTryTimeoutTest() {
  Lock lock;
  lock.lock();
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_for(milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    typename Lock::Token token;
    EXPECT_FALSE(lock.try_lock_shared_for(milliseconds(10), token));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_upgrade_for(milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_until(steady_clock::now() + milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    typename Lock::Token token;
    EXPECT_FALSE(lock.try_lock_shared_until(
        steady_clock::now() + milliseconds(10), token));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(
        lock.try_lock_upgrade_until(steady_clock::now() + milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_until(system_clock::now() + milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    typename Lock::Token token;
    EXPECT_FALSE(lock.try_lock_shared_until(
        system_clock::now() + milliseconds(10), token));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(
        lock.try_lock_upgrade_until(system_clock::now() + milliseconds(10)));
  }));
  lock.unlock();

  lock.lock_shared();
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_for(milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_until(steady_clock::now() + milliseconds(10)));
  }));
  EXPECT_TRUE(funcHasDuration(milliseconds(10), [&] {
    EXPECT_FALSE(lock.try_lock_until(system_clock::now() + milliseconds(10)));
  }));
  lock.unlock_shared();

  lock.lock();
  for (int p = 0; p < 8; ++p) {
    EXPECT_FALSE(lock.try_lock_for(nanoseconds(1 << p)));
  }
  lock.unlock();

  for (int p = 0; p < 8; ++p) {
    typename Lock::ReadHolder holder1(lock);
    typename Lock::ReadHolder holder2(lock);
    typename Lock::ReadHolder holder3(lock);
    EXPECT_FALSE(lock.try_lock_for(nanoseconds(1 << p)));
  }
}

TEST(SharedMutex, failing_try_timeout) {
  runFailingTryTimeoutTest<SharedMutexReadPriority>();
  runFailingTryTimeoutTest<SharedMutexWritePriority>();
}

template <typename Lock>
void runBasicUpgradeTest() {
  Lock lock;
  typename Lock::Token token1;
  typename Lock::Token token2;

  lock.lock_upgrade();
  EXPECT_FALSE(lock.try_lock());
  EXPECT_TRUE(lock.try_lock_shared(token1));
  lock.unlock_shared(token1);
  lock.unlock_upgrade();

  lock.lock_upgrade();
  lock.unlock_upgrade_and_lock();
  EXPECT_FALSE(lock.try_lock_shared(token1));
  lock.unlock();

  lock.lock_upgrade();
  lock.unlock_upgrade_and_lock_shared(token1);
  lock.lock_upgrade();
  lock.unlock_upgrade_and_lock_shared(token2);
  lock.unlock_shared(token1);
  lock.unlock_shared(token2);

  lock.lock();
  lock.unlock_and_lock_upgrade();
  EXPECT_TRUE(lock.try_lock_shared(token1));
  lock.unlock_upgrade();
  lock.unlock_shared(token1);
}

TEST(SharedMutex, basic_upgrade_tests) {
  runBasicUpgradeTest<SharedMutexReadPriority>();
  runBasicUpgradeTest<SharedMutexWritePriority>();
}

TEST(SharedMutex, read_has_prio) {
  SharedMutexReadPriority lock;
  SharedMutexToken token1;
  SharedMutexToken token2;
  lock.lock_shared(token1);
  bool exclusiveAcquired = false;
  auto writer = thread([&] {
    lock.lock();
    exclusiveAcquired = true;
    lock.unlock();
  });

  // lock() can't complete until we unlock token1, but it should stake
  // its claim with regards to other exclusive or upgrade locks.  We can
  // use try_lock_upgrade to poll for that eventuality.
  while (lock.try_lock_upgrade()) {
    lock.unlock_upgrade();
    this_thread::yield();
  }
  EXPECT_FALSE(exclusiveAcquired);

  // Even though lock() is stuck we should be able to get token2
  EXPECT_TRUE(lock.try_lock_shared(token2));
  lock.unlock_shared(token1);
  lock.unlock_shared(token2);
  writer.join();
  EXPECT_TRUE(exclusiveAcquired);
}

TEST(SharedMutex, write_has_prio) {
  SharedMutexWritePriority lock;
  SharedMutexToken token1;
  SharedMutexToken token2;
  lock.lock_shared(token1);
  auto writer = thread([&] {
    lock.lock();
    lock.unlock();
  });

  // eventually lock() should block readers
  while (lock.try_lock_shared(token2)) {
    lock.unlock_shared(token2);
    this_thread::yield();
  }

  lock.unlock_shared(token1);
  writer.join();
}

struct TokenLocker {
  SharedMutexToken token;

  template <typename T>
  void lock(T* lock) {
    lock->lock();
  }

  template <typename T>
  void unlock(T* lock) {
    lock->unlock();
  }

  template <typename T>
  void lock_shared(T* lock) {
    lock->lock_shared(token);
  }

  template <typename T>
  void unlock_shared(T* lock) {
    lock->unlock_shared(token);
  }
};

struct Locker {
  template <typename T>
  void lock(T* lock) {
    lock->lock();
  }

  template <typename T>
  void unlock(T* lock) {
    lock->unlock();
  }

  template <typename T>
  void lock_shared(T* lock) {
    lock->lock_shared();
  }

  template <typename T>
  void unlock_shared(T* lock) {
    lock->unlock_shared();
  }
};

struct EnterLocker {
  template <typename T>
  void lock(T* lock) {
    lock->lock(0);
  }

  template <typename T>
  void unlock(T* lock) {
    lock->unlock();
  }

  template <typename T>
  void lock_shared(T* lock) {
    lock->enter(0);
  }

  template <typename T>
  void unlock_shared(T* lock) {
    lock->leave();
  }
};

struct PosixRWLock {
  pthread_rwlock_t lock_;

  PosixRWLock() { pthread_rwlock_init(&lock_, nullptr); }

  ~PosixRWLock() { pthread_rwlock_destroy(&lock_); }

  void lock() { pthread_rwlock_wrlock(&lock_); }

  void unlock() { pthread_rwlock_unlock(&lock_); }

  void lock_shared() { pthread_rwlock_rdlock(&lock_); }

  void unlock_shared() { pthread_rwlock_unlock(&lock_); }
};

struct PosixMutex {
  pthread_mutex_t lock_;

  PosixMutex() { pthread_mutex_init(&lock_, nullptr); }

  ~PosixMutex() { pthread_mutex_destroy(&lock_); }

  void lock() { pthread_mutex_lock(&lock_); }

  void unlock() { pthread_mutex_unlock(&lock_); }

  void lock_shared() { pthread_mutex_lock(&lock_); }

  void unlock_shared() { pthread_mutex_unlock(&lock_); }
};

template <template <typename> class Atom, typename Lock, typename Locker>
static void runContendedReaders(size_t numOps,
                                size_t numThreads,
                                bool useSeparateLocks) {
  char padding1[64];
  (void)padding1;
  Lock globalLock;
  int valueProtectedByLock = 10;
  char padding2[64];
  (void)padding2;
  Atom<bool> go(false);
  Atom<bool>* goPtr = &go; // workaround for clang bug
  vector<thread> threads(numThreads);

  BENCHMARK_SUSPEND {
    for (size_t t = 0; t < numThreads; ++t) {
      threads[t] = DSched::thread([&, t, numThreads] {
        Lock privateLock;
        Lock* lock = useSeparateLocks ? &privateLock : &globalLock;
        Locker locker;
        while (!goPtr->load()) {
          this_thread::yield();
        }
        for (size_t op = t; op < numOps; op += numThreads) {
          locker.lock_shared(lock);
          // note: folly::doNotOptimizeAway reads and writes to its arg,
          // so the following two lines are very different than a call
          // to folly::doNotOptimizeAway(valueProtectedByLock);
          auto copy = valueProtectedByLock;
          folly::doNotOptimizeAway(copy);
          locker.unlock_shared(lock);
        }
      });
    }
  }

  go.store(true);
  for (auto& thr : threads) {
    DSched::join(thr);
  }
}

static void folly_rwspin_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, RWSpinLock, Locker>(
      numOps, numThreads, useSeparateLocks);
}

static void shmtx_wr_pri_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, SharedMutexWritePriority, TokenLocker>(
      numOps, numThreads, useSeparateLocks);
}

static void shmtx_w_bare_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, SharedMutexWritePriority, Locker>(
      numOps, numThreads, useSeparateLocks);
}

static void shmtx_rd_pri_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, SharedMutexReadPriority, TokenLocker>(
      numOps, numThreads, useSeparateLocks);
}

static void shmtx_r_bare_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, SharedMutexReadPriority, Locker>(
      numOps, numThreads, useSeparateLocks);
}

static void folly_ticket_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, RWTicketSpinLock64, Locker>(
      numOps, numThreads, useSeparateLocks);
}

static void boost_shared_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, boost::shared_mutex, Locker>(
      numOps, numThreads, useSeparateLocks);
}

static void pthrd_rwlock_reads(uint32_t numOps,
                               size_t numThreads,
                               bool useSeparateLocks) {
  runContendedReaders<atomic, PosixRWLock, Locker>(
      numOps, numThreads, useSeparateLocks);
}

template <template <typename> class Atom, typename Lock, typename Locker>
static void runMixed(size_t numOps,
                     size_t numThreads,
                     double writeFraction,
                     bool useSeparateLocks) {
  char padding1[64];
  (void)padding1;
  Lock globalLock;
  int valueProtectedByLock = 0;
  char padding2[64];
  (void)padding2;
  Atom<bool> go(false);
  Atom<bool>* goPtr = &go; // workaround for clang bug
  vector<thread> threads(numThreads);

  BENCHMARK_SUSPEND {
    for (size_t t = 0; t < numThreads; ++t) {
      threads[t] = DSched::thread([&, t, numThreads] {
        struct drand48_data buffer;
        srand48_r(t, &buffer);
        long writeThreshold = writeFraction * 0x7fffffff;
        Lock privateLock;
        Lock* lock = useSeparateLocks ? &privateLock : &globalLock;
        Locker locker;
        while (!goPtr->load()) {
          this_thread::yield();
        }
        for (size_t op = t; op < numOps; op += numThreads) {
          long randVal;
          lrand48_r(&buffer, &randVal);
          bool writeOp = randVal < writeThreshold;
          if (writeOp) {
            locker.lock(lock);
            if (!useSeparateLocks) {
              ++valueProtectedByLock;
            }
            locker.unlock(lock);
          } else {
            locker.lock_shared(lock);
            auto v = valueProtectedByLock;
            folly::doNotOptimizeAway(v);
            locker.unlock_shared(lock);
          }
        }
      });
    }
  }

  go.store(true);
  for (auto& thr : threads) {
    DSched::join(thr);
  }
}

static void folly_rwspin(size_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, RWSpinLock, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void shmtx_wr_pri(uint32_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, SharedMutexWritePriority, TokenLocker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void shmtx_w_bare(uint32_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, SharedMutexWritePriority, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void shmtx_rd_pri(uint32_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, SharedMutexReadPriority, TokenLocker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void shmtx_r_bare(uint32_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, SharedMutexReadPriority, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void folly_ticket(size_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, RWTicketSpinLock64, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void boost_shared(size_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, boost::shared_mutex, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void pthrd_rwlock(size_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, PosixRWLock, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

static void pthrd_mutex_(size_t numOps,
                         size_t numThreads,
                         double writeFraction,
                         bool useSeparateLocks) {
  runMixed<atomic, PosixMutex, Locker>(
      numOps, numThreads, writeFraction, useSeparateLocks);
}

template <typename Lock, template <typename> class Atom>
static void runAllAndValidate(size_t numOps, size_t numThreads) {
  Lock globalLock;
  Atom<int> globalExclusiveCount(0);
  Atom<int> globalUpgradeCount(0);
  Atom<int> globalSharedCount(0);

  Atom<bool> go(false);

  // clang crashes on access to Atom<> captured by ref in closure
  Atom<int>* globalExclusiveCountPtr = &globalExclusiveCount;
  Atom<int>* globalUpgradeCountPtr = &globalUpgradeCount;
  Atom<int>* globalSharedCountPtr = &globalSharedCount;
  Atom<bool>* goPtr = &go;

  vector<thread> threads(numThreads);

  BENCHMARK_SUSPEND {
    for (size_t t = 0; t < numThreads; ++t) {
      threads[t] = DSched::thread([&, t, numThreads] {
        struct drand48_data buffer;
        srand48_r(t, &buffer);

        bool exclusive = false;
        bool upgrade = false;
        bool shared = false;
        bool ourGlobalTokenUsed = false;
        SharedMutexToken ourGlobalToken;

        Lock privateLock;
        vector<SharedMutexToken> privateTokens;

        while (!goPtr->load()) {
          this_thread::yield();
        }
        for (size_t op = t; op < numOps; op += numThreads) {
          // randVal in [0,1000)
          long randVal;
          lrand48_r(&buffer, &randVal);
          randVal = (long)((randVal * (uint64_t)1000) / 0x7fffffff);

          // make as many assertions as possible about the global state
          if (exclusive) {
            EXPECT_EQ(1, globalExclusiveCountPtr->load(memory_order_acquire));
            EXPECT_EQ(0, globalUpgradeCountPtr->load(memory_order_acquire));
            EXPECT_EQ(0, globalSharedCountPtr->load(memory_order_acquire));
          }
          if (upgrade) {
            EXPECT_EQ(0, globalExclusiveCountPtr->load(memory_order_acquire));
            EXPECT_EQ(1, globalUpgradeCountPtr->load(memory_order_acquire));
          }
          if (shared) {
            EXPECT_EQ(0, globalExclusiveCountPtr->load(memory_order_acquire));
            EXPECT_TRUE(globalSharedCountPtr->load(memory_order_acquire) > 0);
          } else {
            EXPECT_FALSE(ourGlobalTokenUsed);
          }

          // independent 20% chance we do something to the private lock
          if (randVal < 200) {
            // it's okay to take multiple private shared locks because
            // we never take an exclusive lock, so reader versus writer
            // priority doesn't cause deadlocks
            if (randVal < 100 && privateTokens.size() > 0) {
              auto i = randVal % privateTokens.size();
              privateLock.unlock_shared(privateTokens[i]);
              privateTokens.erase(privateTokens.begin() + i);
            } else {
              SharedMutexToken token;
              privateLock.lock_shared(token);
              privateTokens.push_back(token);
            }
            continue;
          }

          // if we've got a lock, the only thing we can do is release it
          // or transform it into a different kind of lock
          if (exclusive) {
            exclusive = false;
            --*globalExclusiveCountPtr;
            if (randVal < 500) {
              globalLock.unlock();
            } else if (randVal < 700) {
              globalLock.unlock_and_lock_shared();
              ++*globalSharedCountPtr;
              shared = true;
            } else if (randVal < 900) {
              globalLock.unlock_and_lock_shared(ourGlobalToken);
              ++*globalSharedCountPtr;
              shared = true;
              ourGlobalTokenUsed = true;
            } else {
              globalLock.unlock_and_lock_upgrade();
              ++*globalUpgradeCountPtr;
              upgrade = true;
            }
          } else if (upgrade) {
            upgrade = false;
            --*globalUpgradeCountPtr;
            if (randVal < 500) {
              globalLock.unlock_upgrade();
            } else if (randVal < 700) {
              globalLock.unlock_upgrade_and_lock_shared();
              ++*globalSharedCountPtr;
              shared = true;
            } else if (randVal < 900) {
              globalLock.unlock_upgrade_and_lock_shared(ourGlobalToken);
              ++*globalSharedCountPtr;
              shared = true;
              ourGlobalTokenUsed = true;
            } else {
              globalLock.unlock_upgrade_and_lock();
              ++*globalExclusiveCountPtr;
              exclusive = true;
            }
          } else if (shared) {
            shared = false;
            --*globalSharedCountPtr;
            if (ourGlobalTokenUsed) {
              globalLock.unlock_shared(ourGlobalToken);
              ourGlobalTokenUsed = false;
            } else {
              globalLock.unlock_shared();
            }
          } else if (randVal < 400) {
            // 40% chance of shared lock with token, 5 ways to get it

            // delta t goes from -1 millis to 7 millis
            auto dt = microseconds(10 * (randVal - 100));

            if (randVal < 400) {
              globalLock.lock_shared(ourGlobalToken);
              shared = true;
            } else if (randVal < 500) {
              shared = globalLock.try_lock_shared(ourGlobalToken);
            } else if (randVal < 600) {
              shared = globalLock.try_lock_shared_for(dt, ourGlobalToken);
            } else if (randVal < 800) {
              shared = globalLock.try_lock_shared_until(
                  system_clock::now() + dt, ourGlobalToken);
            }
            if (shared) {
              ourGlobalTokenUsed = true;
              ++*globalSharedCountPtr;
            }
          } else if (randVal < 800) {
            // 40% chance of shared lock without token
            auto dt = microseconds(10 * (randVal - 100));
            if (randVal < 400) {
              globalLock.lock_shared();
              shared = true;
            } else if (randVal < 500) {
              shared = globalLock.try_lock_shared();
            } else if (randVal < 600) {
              shared = globalLock.try_lock_shared_for(dt);
            } else if (randVal < 800) {
              shared = globalLock.try_lock_shared_until(
                  system_clock::now() + dt);
            }
            if (shared) {
              ++*globalSharedCountPtr;
            }
          } else if (randVal < 900) {
            // 10% change of upgrade lock
            globalLock.lock_upgrade();
            upgrade = true;
            ++*globalUpgradeCountPtr;
          } else {
            // 10% chance of exclusive lock, 5 ways to get it

            // delta t goes from -1 millis to 9 millis
            auto dt = microseconds(100 * (randVal - 910));

            if (randVal < 400) {
              globalLock.lock();
              exclusive = true;
            } else if (randVal < 500) {
              exclusive = globalLock.try_lock();
            } else if (randVal < 600) {
              exclusive = globalLock.try_lock_for(dt);
            } else if (randVal < 700) {
              exclusive = globalLock.try_lock_until(steady_clock::now() + dt);
            } else {
              exclusive = globalLock.try_lock_until(system_clock::now() + dt);
            }
            if (exclusive) {
              ++*globalExclusiveCountPtr;
            }
          }
        }

        if (exclusive) {
          --*globalExclusiveCountPtr;
          globalLock.unlock();
        }
        if (upgrade) {
          --*globalUpgradeCountPtr;
          globalLock.unlock_upgrade();
        }
        if (shared) {
          --*globalSharedCountPtr;
          if (ourGlobalTokenUsed) {
            globalLock.unlock_shared(ourGlobalToken);
            ourGlobalTokenUsed = false;
          } else {
            globalLock.unlock_shared();
          }
        }
        for (auto& token : privateTokens) {
          privateLock.unlock_shared(token);
        }
      });
    }
  }

  go.store(true);
  for (auto& thr : threads) {
    DSched::join(thr);
  }
}

TEST(SharedMutex, deterministic_concurrent_readers_of_one_lock_read_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runContendedReaders<DeterministicAtomic,
                        DSharedMutexReadPriority,
                        Locker>(1000, 3, false);
  }
}

TEST(SharedMutex, deterministic_concurrent_readers_of_one_lock_write_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runContendedReaders<DeterministicAtomic,
                        DSharedMutexWritePriority,
                        Locker>(1000, 3, false);
  }
}

TEST(SharedMutex, concurrent_readers_of_one_lock_read_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    runContendedReaders<atomic, SharedMutexReadPriority, Locker>(
        100000, 32, false);
  }
}

TEST(SharedMutex, concurrent_readers_of_one_lock_write_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    runContendedReaders<atomic, SharedMutexWritePriority, Locker>(
        100000, 32, false);
  }
}

TEST(SharedMutex, deterministic_readers_of_concurrent_locks_read_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runContendedReaders<DeterministicAtomic,
                        DSharedMutexReadPriority,
                        Locker>(1000, 3, true);
  }
}

TEST(SharedMutex, deterministic_readers_of_concurrent_locks_write_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runContendedReaders<DeterministicAtomic,
                        DSharedMutexWritePriority,
                        Locker>(1000, 3, true);
  }
}

TEST(SharedMutex, readers_of_concurrent_locks_read_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    runContendedReaders<atomic, SharedMutexReadPriority, TokenLocker>(
        100000, 32, true);
  }
}

TEST(SharedMutex, readers_of_concurrent_locks_write_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    runContendedReaders<atomic, SharedMutexWritePriority, TokenLocker>(
        100000, 32, true);
  }
}

TEST(SharedMutex, deterministic_mixed_mostly_read_read_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runMixed<DeterministicAtomic, DSharedMutexReadPriority, Locker>(
        1000, 3, 0.1, false);
  }
}

TEST(SharedMutex, deterministic_mixed_mostly_read_write_prio) {
  for (int pass = 0; pass < 3; ++pass) {
    DSched sched(DSched::uniform(pass));
    runMixed<DeterministicAtomic, DSharedMutexWritePriority, Locker>(
        1000, 3, 0.1, false);
  }
}

TEST(SharedMutex, mixed_mostly_read_read_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runMixed<atomic, SharedMutexReadPriority, TokenLocker>(
        10000, 32, 0.1, false);
  }
}

TEST(SharedMutex, mixed_mostly_read_write_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runMixed<atomic, SharedMutexWritePriority, TokenLocker>(
        10000, 32, 0.1, false);
  }
}

TEST(SharedMutex, deterministic_mixed_mostly_write_read_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runMixed<DeterministicAtomic, DSharedMutexReadPriority, TokenLocker>(
        1000, 10, 0.9, false);
  }
}

TEST(SharedMutex, deterministic_mixed_mostly_write_write_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runMixed<DeterministicAtomic, DSharedMutexWritePriority, TokenLocker>(
        1000, 10, 0.9, false);
  }
}

TEST(SharedMutex, deterministic_lost_wakeup_write_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    DSched sched(DSched::uniformSubset(pass, 2, 200));
    runMixed<DeterministicAtomic, DSharedMutexWritePriority, TokenLocker>(
        1000, 3, 1.0, false);
  }
}

TEST(SharedMutex, mixed_mostly_write_read_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runMixed<atomic, SharedMutexReadPriority, TokenLocker>(
        50000, 300, 0.9, false);
  }
}

TEST(SharedMutex, mixed_mostly_write_write_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runMixed<atomic, SharedMutexWritePriority, TokenLocker>(
        50000, 300, 0.9, false);
  }
}

TEST(SharedMutex, deterministic_all_ops_read_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    DSched sched(DSched::uniform(pass));
    runAllAndValidate<DSharedMutexReadPriority, DeterministicAtomic>(1000, 8);
  }
}

TEST(SharedMutex, deterministic_all_ops_write_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    DSched sched(DSched::uniform(pass));
    runAllAndValidate<DSharedMutexWritePriority, DeterministicAtomic>(1000, 8);
  }
}

TEST(SharedMutex, all_ops_read_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runAllAndValidate<SharedMutexReadPriority, atomic>(100000, 32);
  }
}

TEST(SharedMutex, all_ops_write_prio) {
  for (int pass = 0; pass < 5; ++pass) {
    runAllAndValidate<SharedMutexWritePriority, atomic>(100000, 32);
  }
}

FOLLY_ASSUME_FBVECTOR_COMPATIBLE(
    boost::optional<boost::optional<SharedMutexToken>>)

// Setup is a set of threads that either grab a shared lock, or exclusive
// and then downgrade it, or upgrade then upgrade and downgrade, then
// enqueue the shared lock to a second set of threads that just performs
// unlocks.  Half of the shared locks use tokens, the others don't.
template <typename Lock, template <typename> class Atom>
static void runRemoteUnlock(size_t numOps,
                            double preWriteFraction,
                            double preUpgradeFraction,
                            size_t numSendingThreads,
                            size_t numReceivingThreads) {
  Lock globalLock;
  MPMCQueue<boost::optional<boost::optional<SharedMutexToken>>, Atom>
    queue(10);
  auto queuePtr = &queue; // workaround for clang crash

  Atom<bool> go(false);
  auto goPtr = &go; // workaround for clang crash
  Atom<int> pendingSenders(numSendingThreads);
  auto pendingSendersPtr = &pendingSenders; // workaround for clang crash
  vector<thread> threads(numSendingThreads + numReceivingThreads);

  BENCHMARK_SUSPEND {
    for (size_t t = 0; t < threads.size(); ++t) {
      threads[t] = DSched::thread([&, t, numSendingThreads] {
        if (t >= numSendingThreads) {
          // we're a receiver
          typename decltype(queue)::value_type elem;
          while (true) {
            queuePtr->blockingRead(elem);
            if (!elem) {
              // EOF, pass the EOF token
              queuePtr->blockingWrite(std::move(elem));
              break;
            }
            if (*elem) {
              globalLock.unlock_shared(**elem);
            } else {
              globalLock.unlock_shared();
            }
          }
          return;
        }
        // else we're a sender

        struct drand48_data buffer;
        srand48_r(t, &buffer);

        while (!goPtr->load()) {
          this_thread::yield();
        }
        for (size_t op = t; op < numOps; op += numSendingThreads) {
          long unscaledRandVal;
          lrand48_r(&buffer, &unscaledRandVal);

          // randVal in [0,1]
          double randVal = ((double)unscaledRandVal) / 0x7fffffff;

          // extract a bit and rescale
          bool useToken = randVal >= 0.5;
          randVal = (randVal - (useToken ? 0.5 : 0.0)) * 2;

          boost::optional<SharedMutexToken> maybeToken;

          if (useToken) {
            SharedMutexToken token;
            if (randVal < preWriteFraction) {
              globalLock.lock();
              globalLock.unlock_and_lock_shared(token);
            } else if (randVal < preWriteFraction + preUpgradeFraction / 2) {
              globalLock.lock_upgrade();
              globalLock.unlock_upgrade_and_lock_shared(token);
            } else if (randVal < preWriteFraction + preUpgradeFraction) {
              globalLock.lock_upgrade();
              globalLock.unlock_upgrade_and_lock();
              globalLock.unlock_and_lock_shared(token);
            } else {
              globalLock.lock_shared(token);
            }
            maybeToken = token;
          } else {
            if (randVal < preWriteFraction) {
              globalLock.lock();
              globalLock.unlock_and_lock_shared();
            } else if (randVal < preWriteFraction + preUpgradeFraction / 2) {
              globalLock.lock_upgrade();
              globalLock.unlock_upgrade_and_lock_shared();
            } else if (randVal < preWriteFraction + preUpgradeFraction) {
              globalLock.lock_upgrade();
              globalLock.unlock_upgrade_and_lock();
              globalLock.unlock_and_lock_shared();
            } else {
              globalLock.lock_shared();
            }
          }

          // blockingWrite is emplace-like, so this automatically adds
          // another level of wrapping
          queuePtr->blockingWrite(maybeToken);
        }
        if (--*pendingSendersPtr == 0) {
          queuePtr->blockingWrite(boost::none);
        }
      });
    }
  }

  go.store(true);
  for (auto& thr : threads) {
    DSched::join(thr);
  }
}

TEST(SharedMutex, deterministic_remote_write_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runRemoteUnlock<DSharedMutexWritePriority, DeterministicAtomic>(
        500, 0.1, 0.1, 5, 5);
  }
}

TEST(SharedMutex, deterministic_remote_read_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runRemoteUnlock<DSharedMutexReadPriority, DeterministicAtomic>(
        500, 0.1, 0.1, 5, 5);
  }
}

TEST(SharedMutex, remote_write_prio) {
  for (int pass = 0; pass < 10; ++pass) {
    runRemoteUnlock<SharedMutexWritePriority, atomic>(100000, 0.1, 0.1, 5, 5);
  }
}

TEST(SharedMutex, remote_read_prio) {
  for (int pass = 0; pass < 100; ++pass) {
    runRemoteUnlock<SharedMutexReadPriority, atomic>(100000, 0.1, 0.1, 5, 5);
  }
}

static void burn(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    folly::doNotOptimizeAway(i);
  }
}

// Two threads and three locks, arranged so that they have to proceed
// in turn with reader/writer conflict
template <typename Lock, template <typename> class Atom = atomic>
static void runPingPong(size_t numRounds, size_t burnCount) {
  char padding1[56];
  (void)padding1;
  pair<Lock, char[56]> locks[3];
  char padding2[56];
  (void)padding2;

  Atom<int> avail(0);
  auto availPtr = &avail; // workaround for clang crash
  Atom<bool> go(false);
  auto goPtr = &go; // workaround for clang crash
  vector<thread> threads(2);

  locks[0].first.lock();
  locks[1].first.lock();
  locks[2].first.lock_shared();

  BENCHMARK_SUSPEND {
    threads[0] = DSched::thread([&] {
      ++*availPtr;
      while (!goPtr->load()) {
        this_thread::yield();
      }
      for (size_t i = 0; i < numRounds; ++i) {
        locks[i % 3].first.unlock();
        locks[(i + 2) % 3].first.lock();
        burn(burnCount);
      }
    });
    threads[1] = DSched::thread([&] {
      ++*availPtr;
      while (!goPtr->load()) {
        this_thread::yield();
      }
      for (size_t i = 0; i < numRounds; ++i) {
        locks[i % 3].first.lock_shared();
        burn(burnCount);
        locks[(i + 2) % 3].first.unlock_shared();
      }
    });

    while (avail.load() < 2) {
      this_thread::yield();
    }
  }

  go.store(true);
  for (auto& thr : threads) {
    DSched::join(thr);
  }
  locks[numRounds % 3].first.unlock();
  locks[(numRounds + 1) % 3].first.unlock();
  locks[(numRounds + 2) % 3].first.unlock_shared();
}

static void folly_rwspin_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<RWSpinLock>(n / scale, burnCount);
}

static void shmtx_w_bare_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<SharedMutexWritePriority>(n / scale, burnCount);
}

static void shmtx_r_bare_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<SharedMutexReadPriority>(n / scale, burnCount);
}

static void folly_ticket_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<RWTicketSpinLock64>(n / scale, burnCount);
}

static void boost_shared_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<boost::shared_mutex>(n / scale, burnCount);
}

static void pthrd_rwlock_ping_pong(size_t n, size_t scale, size_t burnCount) {
  runPingPong<PosixRWLock>(n / scale, burnCount);
}

TEST(SharedMutex, deterministic_ping_pong_write_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runPingPong<DSharedMutexWritePriority, DeterministicAtomic>(500, 0);
  }
}

TEST(SharedMutex, deterministic_ping_pong_read_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    DSched sched(DSched::uniform(pass));
    runPingPong<DSharedMutexReadPriority, DeterministicAtomic>(500, 0);
  }
}

TEST(SharedMutex, ping_pong_write_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    runPingPong<SharedMutexWritePriority, atomic>(50000, 0);
  }
}

TEST(SharedMutex, ping_pong_read_prio) {
  for (int pass = 0; pass < 1; ++pass) {
    runPingPong<SharedMutexReadPriority, atomic>(50000, 0);
  }
}

// This is here so you can tell how much of the runtime reported by the
// more complex harnesses is due to the harness, although due to the
// magic of compiler optimization it may also be slower
BENCHMARK(single_thread_lock_shared_unlock_shared, iters) {
  SharedMutex lock;
  for (size_t n = 0; n < iters; ++n) {
    SharedMutex::Token token;
    lock.lock_shared(token);
    folly::doNotOptimizeAway(0);
    lock.unlock_shared(token);
  }
}

BENCHMARK(single_thread_lock_unlock, iters) {
  SharedMutex lock;
  for (size_t n = 0; n < iters; ++n) {
    lock.lock();
    folly::doNotOptimizeAway(0);
    lock.unlock();
  }
}

#define BENCH_BASE(...) FB_VA_GLUE(BENCHMARK_NAMED_PARAM, (__VA_ARGS__))
#define BENCH_REL(...) FB_VA_GLUE(BENCHMARK_RELATIVE_NAMED_PARAM, (__VA_ARGS__))

// 100% reads.  Best-case scenario for deferred locks.  Lock is colocated
// with read data, so inline lock takes cache miss every time but deferred
// lock has only cache hits and local access.
BENCHMARK_DRAW_LINE()
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 1thread, 1, false)
BENCH_REL (shmtx_wr_pri_reads, 1thread, 1, false)
BENCH_REL (shmtx_w_bare_reads, 1thread, 1, false)
BENCH_REL (shmtx_rd_pri_reads, 1thread, 1, false)
BENCH_REL (shmtx_r_bare_reads, 1thread, 1, false)
BENCH_REL (folly_ticket_reads, 1thread, 1, false)
BENCH_REL (boost_shared_reads, 1thread, 1, false)
BENCH_REL (pthrd_rwlock_reads, 1thread, 1, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 2thread, 2, false)
BENCH_REL (shmtx_wr_pri_reads, 2thread, 2, false)
BENCH_REL (shmtx_w_bare_reads, 2thread, 2, false)
BENCH_REL (shmtx_rd_pri_reads, 2thread, 2, false)
BENCH_REL (shmtx_r_bare_reads, 2thread, 2, false)
BENCH_REL (folly_ticket_reads, 2thread, 2, false)
BENCH_REL (boost_shared_reads, 2thread, 2, false)
BENCH_REL (pthrd_rwlock_reads, 2thread, 2, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 4thread, 4, false)
BENCH_REL (shmtx_wr_pri_reads, 4thread, 4, false)
BENCH_REL (shmtx_w_bare_reads, 4thread, 4, false)
BENCH_REL (shmtx_rd_pri_reads, 4thread, 4, false)
BENCH_REL (shmtx_r_bare_reads, 4thread, 4, false)
BENCH_REL (folly_ticket_reads, 4thread, 4, false)
BENCH_REL (boost_shared_reads, 4thread, 4, false)
BENCH_REL (pthrd_rwlock_reads, 4thread, 4, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 8thread, 8, false)
BENCH_REL (shmtx_wr_pri_reads, 8thread, 8, false)
BENCH_REL (shmtx_w_bare_reads, 8thread, 8, false)
BENCH_REL (shmtx_rd_pri_reads, 8thread, 8, false)
BENCH_REL (shmtx_r_bare_reads, 8thread, 8, false)
BENCH_REL (folly_ticket_reads, 8thread, 8, false)
BENCH_REL (boost_shared_reads, 8thread, 8, false)
BENCH_REL (pthrd_rwlock_reads, 8thread, 8, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 16thread, 16, false)
BENCH_REL (shmtx_wr_pri_reads, 16thread, 16, false)
BENCH_REL (shmtx_w_bare_reads, 16thread, 16, false)
BENCH_REL (shmtx_rd_pri_reads, 16thread, 16, false)
BENCH_REL (shmtx_r_bare_reads, 16thread, 16, false)
BENCH_REL (folly_ticket_reads, 16thread, 16, false)
BENCH_REL (boost_shared_reads, 16thread, 16, false)
BENCH_REL (pthrd_rwlock_reads, 16thread, 16, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 32thread, 32, false)
BENCH_REL (shmtx_wr_pri_reads, 32thread, 32, false)
BENCH_REL (shmtx_w_bare_reads, 32thread, 32, false)
BENCH_REL (shmtx_rd_pri_reads, 32thread, 32, false)
BENCH_REL (shmtx_r_bare_reads, 32thread, 32, false)
BENCH_REL (folly_ticket_reads, 32thread, 32, false)
BENCH_REL (boost_shared_reads, 32thread, 32, false)
BENCH_REL (pthrd_rwlock_reads, 32thread, 32, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_reads, 64thread, 64, false)
BENCH_REL (shmtx_wr_pri_reads, 64thread, 64, false)
BENCH_REL (shmtx_w_bare_reads, 64thread, 64, false)
BENCH_REL (shmtx_rd_pri_reads, 64thread, 64, false)
BENCH_REL (shmtx_r_bare_reads, 64thread, 64, false)
BENCH_REL (folly_ticket_reads, 64thread, 64, false)
BENCH_REL (boost_shared_reads, 64thread, 64, false)
BENCH_REL (pthrd_rwlock_reads, 64thread, 64, false)

// 1 lock used by everybody, 100% writes.  Threads only hurt, but it is
// good to not fail catastrophically.  Compare to single_thread_lock_unlock
// to see the overhead of the generic driver (and its pseudo-random number
// generator).  pthrd_mutex_ is a pthread_mutex_t (default, not adaptive),
// which is better than any of the reader-writer locks for this scenario.
BENCHMARK_DRAW_LINE()
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 1thread_all_write, 1, 1.0, false)
BENCH_REL (shmtx_wr_pri, 1thread_all_write, 1, 1.0, false)
BENCH_REL (shmtx_rd_pri, 1thread_all_write, 1, 1.0, false)
BENCH_REL (folly_ticket, 1thread_all_write, 1, 1.0, false)
BENCH_REL (boost_shared, 1thread_all_write, 1, 1.0, false)
BENCH_REL (pthrd_rwlock, 1thread_all_write, 1, 1.0, false)
BENCH_REL (pthrd_mutex_, 1thread_all_write, 1, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thread_all_write, 2, 1.0, false)
BENCH_REL (shmtx_wr_pri, 2thread_all_write, 2, 1.0, false)
BENCH_REL (shmtx_rd_pri, 2thread_all_write, 2, 1.0, false)
BENCH_REL (folly_ticket, 2thread_all_write, 2, 1.0, false)
BENCH_REL (boost_shared, 2thread_all_write, 2, 1.0, false)
BENCH_REL (pthrd_rwlock, 2thread_all_write, 2, 1.0, false)
BENCH_REL (pthrd_mutex_, 2thread_all_write, 2, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 4thread_all_write, 4, 1.0, false)
BENCH_REL (shmtx_wr_pri, 4thread_all_write, 4, 1.0, false)
BENCH_REL (shmtx_rd_pri, 4thread_all_write, 4, 1.0, false)
BENCH_REL (folly_ticket, 4thread_all_write, 4, 1.0, false)
BENCH_REL (boost_shared, 4thread_all_write, 4, 1.0, false)
BENCH_REL (pthrd_rwlock, 4thread_all_write, 4, 1.0, false)
BENCH_REL (pthrd_mutex_, 4thread_all_write, 4, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 8thread_all_write, 8, 1.0, false)
BENCH_REL (shmtx_wr_pri, 8thread_all_write, 8, 1.0, false)
BENCH_REL (shmtx_rd_pri, 8thread_all_write, 8, 1.0, false)
BENCH_REL (folly_ticket, 8thread_all_write, 8, 1.0, false)
BENCH_REL (boost_shared, 8thread_all_write, 8, 1.0, false)
BENCH_REL (pthrd_rwlock, 8thread_all_write, 8, 1.0, false)
BENCH_REL (pthrd_mutex_, 8thread_all_write, 8, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 16thread_all_write, 16, 1.0, false)
BENCH_REL (shmtx_wr_pri, 16thread_all_write, 16, 1.0, false)
BENCH_REL (shmtx_rd_pri, 16thread_all_write, 16, 1.0, false)
BENCH_REL (folly_ticket, 16thread_all_write, 16, 1.0, false)
BENCH_REL (boost_shared, 16thread_all_write, 16, 1.0, false)
BENCH_REL (pthrd_rwlock, 16thread_all_write, 16, 1.0, false)
BENCH_REL (pthrd_mutex_, 16thread_all_write, 16, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 32thread_all_write, 32, 1.0, false)
BENCH_REL (shmtx_wr_pri, 32thread_all_write, 32, 1.0, false)
BENCH_REL (shmtx_rd_pri, 32thread_all_write, 32, 1.0, false)
BENCH_REL (folly_ticket, 32thread_all_write, 32, 1.0, false)
BENCH_REL (boost_shared, 32thread_all_write, 32, 1.0, false)
BENCH_REL (pthrd_rwlock, 32thread_all_write, 32, 1.0, false)
BENCH_REL (pthrd_mutex_, 32thread_all_write, 32, 1.0, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 64thread_all_write, 64, 1.0, false)
BENCH_REL (shmtx_wr_pri, 64thread_all_write, 64, 1.0, false)
BENCH_REL (shmtx_rd_pri, 64thread_all_write, 64, 1.0, false)
BENCH_REL (folly_ticket, 64thread_all_write, 64, 1.0, false)
BENCH_REL (boost_shared, 64thread_all_write, 64, 1.0, false)
BENCH_REL (pthrd_rwlock, 64thread_all_write, 64, 1.0, false)
BENCH_REL (pthrd_mutex_, 64thread_all_write, 64, 1.0, false)

// 1 lock used by everybody, 10% writes.  Not much scaling to be had.  Perf
// is best at 1 thread, once you've got multiple threads > 8 threads hurts.
BENCHMARK_DRAW_LINE()
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 1thread_10pct_write, 1, 0.10, false)
BENCH_REL (shmtx_wr_pri, 1thread_10pct_write, 1, 0.10, false)
BENCH_REL (shmtx_rd_pri, 1thread_10pct_write, 1, 0.10, false)
BENCH_REL (folly_ticket, 1thread_10pct_write, 1, 0.10, false)
BENCH_REL (boost_shared, 1thread_10pct_write, 1, 0.10, false)
BENCH_REL (pthrd_rwlock, 1thread_10pct_write, 1, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thread_10pct_write, 2, 0.10, false)
BENCH_REL (shmtx_wr_pri, 2thread_10pct_write, 2, 0.10, false)
BENCH_REL (shmtx_rd_pri, 2thread_10pct_write, 2, 0.10, false)
BENCH_REL (folly_ticket, 2thread_10pct_write, 2, 0.10, false)
BENCH_REL (boost_shared, 2thread_10pct_write, 2, 0.10, false)
BENCH_REL (pthrd_rwlock, 2thread_10pct_write, 2, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 4thread_10pct_write, 4, 0.10, false)
BENCH_REL (shmtx_wr_pri, 4thread_10pct_write, 4, 0.10, false)
BENCH_REL (shmtx_rd_pri, 4thread_10pct_write, 4, 0.10, false)
BENCH_REL (folly_ticket, 4thread_10pct_write, 4, 0.10, false)
BENCH_REL (boost_shared, 4thread_10pct_write, 4, 0.10, false)
BENCH_REL (pthrd_rwlock, 4thread_10pct_write, 4, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 8thread_10pct_write, 8, 0.10, false)
BENCH_REL (shmtx_wr_pri, 8thread_10pct_write, 8, 0.10, false)
BENCH_REL (shmtx_rd_pri, 8thread_10pct_write, 8, 0.10, false)
BENCH_REL (folly_ticket, 8thread_10pct_write, 8, 0.10, false)
BENCH_REL (boost_shared, 8thread_10pct_write, 8, 0.10, false)
BENCH_REL (pthrd_rwlock, 8thread_10pct_write, 8, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 16thread_10pct_write, 16, 0.10, false)
BENCH_REL (shmtx_wr_pri, 16thread_10pct_write, 16, 0.10, false)
BENCH_REL (shmtx_rd_pri, 16thread_10pct_write, 16, 0.10, false)
BENCH_REL (folly_ticket, 16thread_10pct_write, 16, 0.10, false)
BENCH_REL (boost_shared, 16thread_10pct_write, 16, 0.10, false)
BENCH_REL (pthrd_rwlock, 16thread_10pct_write, 16, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 32thread_10pct_write, 32, 0.10, false)
BENCH_REL (shmtx_wr_pri, 32thread_10pct_write, 32, 0.10, false)
BENCH_REL (shmtx_rd_pri, 32thread_10pct_write, 32, 0.10, false)
BENCH_REL (folly_ticket, 32thread_10pct_write, 32, 0.10, false)
BENCH_REL (boost_shared, 32thread_10pct_write, 32, 0.10, false)
BENCH_REL (pthrd_rwlock, 32thread_10pct_write, 32, 0.10, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 64thread_10pct_write, 64, 0.10, false)
BENCH_REL (shmtx_wr_pri, 64thread_10pct_write, 64, 0.10, false)
BENCH_REL (shmtx_rd_pri, 64thread_10pct_write, 64, 0.10, false)
BENCH_REL (folly_ticket, 64thread_10pct_write, 64, 0.10, false)
BENCH_REL (boost_shared, 64thread_10pct_write, 64, 0.10, false)
BENCH_REL (pthrd_rwlock, 64thread_10pct_write, 64, 0.10, false)

// 1 lock used by everybody, 1% writes.  This is a more realistic example
// than the concurrent_*_reads benchmark, but still shows SharedMutex locks
// winning over all of the others
BENCHMARK_DRAW_LINE()
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (shmtx_wr_pri, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (shmtx_w_bare, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (shmtx_rd_pri, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (shmtx_r_bare, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (folly_ticket, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (boost_shared, 1thread_1pct_write, 1, 0.01, false)
BENCH_REL (pthrd_rwlock, 1thread_1pct_write, 1, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (shmtx_wr_pri, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (shmtx_w_bare, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (shmtx_rd_pri, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (shmtx_r_bare, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (folly_ticket, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (boost_shared, 2thread_1pct_write, 2, 0.01, false)
BENCH_REL (pthrd_rwlock, 2thread_1pct_write, 2, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (shmtx_wr_pri, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (shmtx_w_bare, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (shmtx_rd_pri, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (shmtx_r_bare, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (folly_ticket, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (boost_shared, 4thread_1pct_write, 4, 0.01, false)
BENCH_REL (pthrd_rwlock, 4thread_1pct_write, 4, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (shmtx_wr_pri, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (shmtx_w_bare, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (shmtx_rd_pri, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (shmtx_r_bare, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (folly_ticket, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (boost_shared, 8thread_1pct_write, 8, 0.01, false)
BENCH_REL (pthrd_rwlock, 8thread_1pct_write, 8, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (shmtx_wr_pri, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (shmtx_w_bare, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (shmtx_rd_pri, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (shmtx_r_bare, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (folly_ticket, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (boost_shared, 16thread_1pct_write, 16, 0.01, false)
BENCH_REL (pthrd_rwlock, 16thread_1pct_write, 16, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (shmtx_wr_pri, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (shmtx_w_bare, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (shmtx_rd_pri, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (shmtx_r_bare, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (folly_ticket, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (boost_shared, 32thread_1pct_write, 32, 0.01, false)
BENCH_REL (pthrd_rwlock, 32thread_1pct_write, 32, 0.01, false)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (shmtx_wr_pri, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (shmtx_w_bare, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (shmtx_rd_pri, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (shmtx_r_bare, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (folly_ticket, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (boost_shared, 64thread_1pct_write, 64, 0.01, false)
BENCH_REL (pthrd_rwlock, 64thread_1pct_write, 64, 0.01, false)

// Worst case scenario for deferred locks. No actual sharing, likely that
// read operations will have to first set the kDeferredReadersPossibleBit,
// and likely that writers will have to scan deferredReaders[].
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thr_2lock_50pct_write, 2, 0.50, true)
BENCH_REL (shmtx_wr_pri, 2thr_2lock_50pct_write, 2, 0.50, true)
BENCH_REL (shmtx_rd_pri, 2thr_2lock_50pct_write, 2, 0.50, true)
BENCH_BASE(folly_rwspin, 4thr_4lock_50pct_write, 4, 0.50, true)
BENCH_REL (shmtx_wr_pri, 4thr_4lock_50pct_write, 4, 0.50, true)
BENCH_REL (shmtx_rd_pri, 4thr_4lock_50pct_write, 4, 0.50, true)
BENCH_BASE(folly_rwspin, 8thr_8lock_50pct_write, 8, 0.50, true)
BENCH_REL (shmtx_wr_pri, 8thr_8lock_50pct_write, 8, 0.50, true)
BENCH_REL (shmtx_rd_pri, 8thr_8lock_50pct_write, 8, 0.50, true)
BENCH_BASE(folly_rwspin, 16thr_16lock_50pct_write, 16, 0.50, true)
BENCH_REL (shmtx_wr_pri, 16thr_16lock_50pct_write, 16, 0.50, true)
BENCH_REL (shmtx_rd_pri, 16thr_16lock_50pct_write, 16, 0.50, true)
BENCH_BASE(folly_rwspin, 32thr_32lock_50pct_write, 32, 0.50, true)
BENCH_REL (shmtx_wr_pri, 32thr_32lock_50pct_write, 32, 0.50, true)
BENCH_REL (shmtx_rd_pri, 32thr_32lock_50pct_write, 32, 0.50, true)
BENCH_BASE(folly_rwspin, 64thr_64lock_50pct_write, 64, 0.50, true)
BENCH_REL (shmtx_wr_pri, 64thr_64lock_50pct_write, 64, 0.50, true)
BENCH_REL (shmtx_rd_pri, 64thr_64lock_50pct_write, 64, 0.50, true)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thr_2lock_10pct_write, 2, 0.10, true)
BENCH_REL (shmtx_wr_pri, 2thr_2lock_10pct_write, 2, 0.10, true)
BENCH_REL (shmtx_rd_pri, 2thr_2lock_10pct_write, 2, 0.10, true)
BENCH_BASE(folly_rwspin, 4thr_4lock_10pct_write, 4, 0.10, true)
BENCH_REL (shmtx_wr_pri, 4thr_4lock_10pct_write, 4, 0.10, true)
BENCH_REL (shmtx_rd_pri, 4thr_4lock_10pct_write, 4, 0.10, true)
BENCH_BASE(folly_rwspin, 8thr_8lock_10pct_write, 8, 0.10, true)
BENCH_REL (shmtx_wr_pri, 8thr_8lock_10pct_write, 8, 0.10, true)
BENCH_REL (shmtx_rd_pri, 8thr_8lock_10pct_write, 8, 0.10, true)
BENCH_BASE(folly_rwspin, 16thr_16lock_10pct_write, 16, 0.10, true)
BENCH_REL (shmtx_wr_pri, 16thr_16lock_10pct_write, 16, 0.10, true)
BENCH_REL (shmtx_rd_pri, 16thr_16lock_10pct_write, 16, 0.10, true)
BENCH_BASE(folly_rwspin, 32thr_32lock_10pct_write, 32, 0.10, true)
BENCH_REL (shmtx_wr_pri, 32thr_32lock_10pct_write, 32, 0.10, true)
BENCH_REL (shmtx_rd_pri, 32thr_32lock_10pct_write, 32, 0.10, true)
BENCH_BASE(folly_rwspin, 64thr_64lock_10pct_write, 64, 0.10, true)
BENCH_REL (shmtx_wr_pri, 64thr_64lock_10pct_write, 64, 0.10, true)
BENCH_REL (shmtx_rd_pri, 64thr_64lock_10pct_write, 64, 0.10, true)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin, 2thr_2lock_1pct_write, 2, 0.01, true)
BENCH_REL (shmtx_wr_pri, 2thr_2lock_1pct_write, 2, 0.01, true)
BENCH_REL (shmtx_rd_pri, 2thr_2lock_1pct_write, 2, 0.01, true)
BENCH_BASE(folly_rwspin, 4thr_4lock_1pct_write, 4, 0.01, true)
BENCH_REL (shmtx_wr_pri, 4thr_4lock_1pct_write, 4, 0.01, true)
BENCH_REL (shmtx_rd_pri, 4thr_4lock_1pct_write, 4, 0.01, true)
BENCH_BASE(folly_rwspin, 8thr_8lock_1pct_write, 8, 0.01, true)
BENCH_REL (shmtx_wr_pri, 8thr_8lock_1pct_write, 8, 0.01, true)
BENCH_REL (shmtx_rd_pri, 8thr_8lock_1pct_write, 8, 0.01, true)
BENCH_BASE(folly_rwspin, 16thr_16lock_1pct_write, 16, 0.01, true)
BENCH_REL (shmtx_wr_pri, 16thr_16lock_1pct_write, 16, 0.01, true)
BENCH_REL (shmtx_rd_pri, 16thr_16lock_1pct_write, 16, 0.01, true)
BENCH_BASE(folly_rwspin, 32thr_32lock_1pct_write, 32, 0.01, true)
BENCH_REL (shmtx_wr_pri, 32thr_32lock_1pct_write, 32, 0.01, true)
BENCH_REL (shmtx_rd_pri, 32thr_32lock_1pct_write, 32, 0.01, true)
BENCH_BASE(folly_rwspin, 64thr_64lock_1pct_write, 64, 0.01, true)
BENCH_REL (shmtx_wr_pri, 64thr_64lock_1pct_write, 64, 0.01, true)
BENCH_REL (shmtx_rd_pri, 64thr_64lock_1pct_write, 64, 0.01, true)

// Ping-pong tests have a scaled number of iterations, because their burn
// loop would make them too slow otherwise.  Ping-pong with burn count of
// 100k or 300k shows the advantage of soft-spin, reducing the cost of
// each wakeup by about 20 usec.  (Take benchmark reported difference,
// ~400 nanos, multiply by the scale of 100, then divide by 2 because
// each round has two wakeups.)
BENCHMARK_DRAW_LINE()
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_ping_pong, burn0, 1, 0)
BENCH_REL (shmtx_w_bare_ping_pong, burn0, 1, 0)
BENCH_REL (shmtx_r_bare_ping_pong, burn0, 1, 0)
BENCH_REL (folly_ticket_ping_pong, burn0, 1, 0)
BENCH_REL (boost_shared_ping_pong, burn0, 1, 0)
BENCH_REL (pthrd_rwlock_ping_pong, burn0, 1, 0)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_ping_pong, burn100k, 100, 100000)
BENCH_REL (shmtx_w_bare_ping_pong, burn100k, 100, 100000)
BENCH_REL (shmtx_r_bare_ping_pong, burn100k, 100, 100000)
BENCH_REL (folly_ticket_ping_pong, burn100k, 100, 100000)
BENCH_REL (boost_shared_ping_pong, burn100k, 100, 100000)
BENCH_REL (pthrd_rwlock_ping_pong, burn100k, 100, 100000)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_ping_pong, burn300k, 100, 300000)
BENCH_REL (shmtx_w_bare_ping_pong, burn300k, 100, 300000)
BENCH_REL (shmtx_r_bare_ping_pong, burn300k, 100, 300000)
BENCH_REL (folly_ticket_ping_pong, burn300k, 100, 300000)
BENCH_REL (boost_shared_ping_pong, burn300k, 100, 300000)
BENCH_REL (pthrd_rwlock_ping_pong, burn300k, 100, 300000)
BENCHMARK_DRAW_LINE()
BENCH_BASE(folly_rwspin_ping_pong, burn1M, 1000, 1000000)
BENCH_REL (shmtx_w_bare_ping_pong, burn1M, 1000, 1000000)
BENCH_REL (shmtx_r_bare_ping_pong, burn1M, 1000, 1000000)
BENCH_REL (folly_ticket_ping_pong, burn1M, 1000, 1000000)
BENCH_REL (boost_shared_ping_pong, burn1M, 1000, 1000000)
BENCH_REL (pthrd_rwlock_ping_pong, burn1M, 1000, 1000000)

// Reproduce with 10 minutes and
//   sudo nice -n -20
//     shared_mutex_test --benchmark --bm_min_iters=1000000
//
// Comparison use folly::RWSpinLock as the baseline, with the
// following row being the default SharedMutex (using *Holder or
// Token-ful methods).
//
// Following results on 2-socket Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
//
// ============================================================================
// folly/test/SharedMutexTest.cpp                  relative  time/iter  iters/s
// ============================================================================
// single_thread_lock_shared_unlock_shared                     25.17ns   39.74M
// single_thread_lock_unlock                                   25.88ns   38.64M
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// folly_rwspin_reads(1thread)                                 15.16ns   65.95M
// shmtx_wr_pri_reads(1thread)                       69.18%    21.92ns   45.63M
// shmtx_w_bare_reads(1thread)                       56.07%    27.04ns   36.98M
// shmtx_rd_pri_reads(1thread)                       69.06%    21.95ns   45.55M
// shmtx_r_bare_reads(1thread)                       56.36%    26.90ns   37.17M
// folly_ticket_reads(1thread)                       57.56%    26.34ns   37.96M
// boost_shared_reads(1thread)                       10.55%   143.72ns    6.96M
// pthrd_rwlock_reads(1thread)                       39.61%    38.28ns   26.12M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(2thread)                                 45.05ns   22.20M
// shmtx_wr_pri_reads(2thread)                      379.98%    11.86ns   84.34M
// shmtx_w_bare_reads(2thread)                      319.27%    14.11ns   70.87M
// shmtx_rd_pri_reads(2thread)                      385.59%    11.68ns   85.59M
// shmtx_r_bare_reads(2thread)                      306.56%    14.70ns   68.04M
// folly_ticket_reads(2thread)                       61.07%    73.78ns   13.55M
// boost_shared_reads(2thread)                       13.54%   332.66ns    3.01M
// pthrd_rwlock_reads(2thread)                       34.22%   131.65ns    7.60M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(4thread)                                 62.19ns   16.08M
// shmtx_wr_pri_reads(4thread)                     1022.82%     6.08ns  164.48M
// shmtx_w_bare_reads(4thread)                      875.37%     7.10ns  140.76M
// shmtx_rd_pri_reads(4thread)                     1060.46%     5.86ns  170.53M
// shmtx_r_bare_reads(4thread)                      879.88%     7.07ns  141.49M
// folly_ticket_reads(4thread)                       64.62%    96.23ns   10.39M
// boost_shared_reads(4thread)                       14.86%   418.49ns    2.39M
// pthrd_rwlock_reads(4thread)                       25.01%   248.65ns    4.02M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(8thread)                                 64.09ns   15.60M
// shmtx_wr_pri_reads(8thread)                     2191.99%     2.92ns  342.03M
// shmtx_w_bare_reads(8thread)                     1804.92%     3.55ns  281.63M
// shmtx_rd_pri_reads(8thread)                     2194.60%     2.92ns  342.44M
// shmtx_r_bare_reads(8thread)                     1800.53%     3.56ns  280.95M
// folly_ticket_reads(8thread)                       54.90%   116.74ns    8.57M
// boost_shared_reads(8thread)                       18.25%   351.24ns    2.85M
// pthrd_rwlock_reads(8thread)                       28.19%   227.31ns    4.40M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(16thread)                                70.06ns   14.27M
// shmtx_wr_pri_reads(16thread)                    4970.09%     1.41ns  709.38M
// shmtx_w_bare_reads(16thread)                    4143.75%     1.69ns  591.44M
// shmtx_rd_pri_reads(16thread)                    5009.31%     1.40ns  714.98M
// shmtx_r_bare_reads(16thread)                    4067.36%     1.72ns  580.54M
// folly_ticket_reads(16thread)                      46.78%   149.77ns    6.68M
// boost_shared_reads(16thread)                      21.67%   323.37ns    3.09M
// pthrd_rwlock_reads(16thread)                      35.05%   199.90ns    5.00M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(32thread)                                58.83ns   17.00M
// shmtx_wr_pri_reads(32thread)                    5158.37%     1.14ns  876.79M
// shmtx_w_bare_reads(32thread)                    4246.03%     1.39ns  721.72M
// shmtx_rd_pri_reads(32thread)                    4845.97%     1.21ns  823.69M
// shmtx_r_bare_reads(32thread)                    4721.44%     1.25ns  802.52M
// folly_ticket_reads(32thread)                      28.40%   207.15ns    4.83M
// boost_shared_reads(32thread)                      17.08%   344.54ns    2.90M
// pthrd_rwlock_reads(32thread)                      30.01%   196.02ns    5.10M
// ----------------------------------------------------------------------------
// folly_rwspin_reads(64thread)                                59.19ns   16.89M
// shmtx_wr_pri_reads(64thread)                    3804.54%     1.56ns  642.76M
// shmtx_w_bare_reads(64thread)                    3625.06%     1.63ns  612.43M
// shmtx_rd_pri_reads(64thread)                    3418.19%     1.73ns  577.48M
// shmtx_r_bare_reads(64thread)                    3416.98%     1.73ns  577.28M
// folly_ticket_reads(64thread)                      30.53%   193.90ns    5.16M
// boost_shared_reads(64thread)                      18.59%   318.47ns    3.14M
// pthrd_rwlock_reads(64thread)                      31.35%   188.81ns    5.30M
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// folly_rwspin(1thread_all_write)                             23.77ns   42.06M
// shmtx_wr_pri(1thread_all_write)                   85.09%    27.94ns   35.79M
// shmtx_rd_pri(1thread_all_write)                   85.32%    27.87ns   35.89M
// folly_ticket(1thread_all_write)                   88.11%    26.98ns   37.06M
// boost_shared(1thread_all_write)                   16.49%   144.14ns    6.94M
// pthrd_rwlock(1thread_all_write)                   53.99%    44.04ns   22.71M
// pthrd_mutex_(1thread_all_write)                   86.05%    27.63ns   36.20M
// ----------------------------------------------------------------------------
// folly_rwspin(2thread_all_write)                             76.05ns   13.15M
// shmtx_wr_pri(2thread_all_write)                   60.67%   125.35ns    7.98M
// shmtx_rd_pri(2thread_all_write)                   60.36%   125.99ns    7.94M
// folly_ticket(2thread_all_write)                  129.10%    58.91ns   16.98M
// boost_shared(2thread_all_write)                   18.65%   407.74ns    2.45M
// pthrd_rwlock(2thread_all_write)                   40.90%   185.92ns    5.38M
// pthrd_mutex_(2thread_all_write)                  127.37%    59.71ns   16.75M
// ----------------------------------------------------------------------------
// folly_rwspin(4thread_all_write)                            207.17ns    4.83M
// shmtx_wr_pri(4thread_all_write)                  119.42%   173.49ns    5.76M
// shmtx_rd_pri(4thread_all_write)                  117.68%   176.05ns    5.68M
// folly_ticket(4thread_all_write)                  182.39%   113.59ns    8.80M
// boost_shared(4thread_all_write)                   11.98%     1.73us  578.46K
// pthrd_rwlock(4thread_all_write)                   27.50%   753.25ns    1.33M
// pthrd_mutex_(4thread_all_write)                  117.75%   175.95ns    5.68M
// ----------------------------------------------------------------------------
// folly_rwspin(8thread_all_write)                            326.50ns    3.06M
// shmtx_wr_pri(8thread_all_write)                  125.47%   260.22ns    3.84M
// shmtx_rd_pri(8thread_all_write)                  124.73%   261.76ns    3.82M
// folly_ticket(8thread_all_write)                  253.39%   128.85ns    7.76M
// boost_shared(8thread_all_write)                    6.36%     5.13us  194.87K
// pthrd_rwlock(8thread_all_write)                   38.54%   847.09ns    1.18M
// pthrd_mutex_(8thread_all_write)                  166.31%   196.32ns    5.09M
// ----------------------------------------------------------------------------
// folly_rwspin(16thread_all_write)                           729.89ns    1.37M
// shmtx_wr_pri(16thread_all_write)                 219.91%   331.91ns    3.01M
// shmtx_rd_pri(16thread_all_write)                 220.09%   331.62ns    3.02M
// folly_ticket(16thread_all_write)                 390.06%   187.12ns    5.34M
// boost_shared(16thread_all_write)                  10.27%     7.11us  140.72K
// pthrd_rwlock(16thread_all_write)                 113.90%   640.84ns    1.56M
// pthrd_mutex_(16thread_all_write)                 401.97%   181.58ns    5.51M
// ----------------------------------------------------------------------------
// folly_rwspin(32thread_all_write)                             1.55us  645.01K
// shmtx_wr_pri(32thread_all_write)                 415.05%   373.54ns    2.68M
// shmtx_rd_pri(32thread_all_write)                 258.45%   599.88ns    1.67M
// folly_ticket(32thread_all_write)                 525.40%   295.09ns    3.39M
// boost_shared(32thread_all_write)                  20.84%     7.44us  134.45K
// pthrd_rwlock(32thread_all_write)                 254.16%   610.00ns    1.64M
// pthrd_mutex_(32thread_all_write)                 852.51%   181.86ns    5.50M
// ----------------------------------------------------------------------------
// folly_rwspin(64thread_all_write)                             2.03us  492.00K
// shmtx_wr_pri(64thread_all_write)                 517.65%   392.64ns    2.55M
// shmtx_rd_pri(64thread_all_write)                 288.20%   705.24ns    1.42M
// folly_ticket(64thread_all_write)                 638.22%   318.47ns    3.14M
// boost_shared(64thread_all_write)                  27.56%     7.37us  135.61K
// pthrd_rwlock(64thread_all_write)                 326.75%   622.04ns    1.61M
// pthrd_mutex_(64thread_all_write)                1231.57%   165.04ns    6.06M
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// folly_rwspin(1thread_10pct_write)                           19.39ns   51.58M
// shmtx_wr_pri(1thread_10pct_write)                 93.87%    20.65ns   48.42M
// shmtx_rd_pri(1thread_10pct_write)                 93.60%    20.71ns   48.28M
// folly_ticket(1thread_10pct_write)                 73.75%    26.29ns   38.04M
// boost_shared(1thread_10pct_write)                 12.97%   149.53ns    6.69M
// pthrd_rwlock(1thread_10pct_write)                 44.15%    43.92ns   22.77M
// ----------------------------------------------------------------------------
// folly_rwspin(2thread_10pct_write)                          227.88ns    4.39M
// shmtx_wr_pri(2thread_10pct_write)                321.08%    70.98ns   14.09M
// shmtx_rd_pri(2thread_10pct_write)                280.65%    81.20ns   12.32M
// folly_ticket(2thread_10pct_write)                220.43%   103.38ns    9.67M
// boost_shared(2thread_10pct_write)                 58.78%   387.71ns    2.58M
// pthrd_rwlock(2thread_10pct_write)                112.68%   202.23ns    4.94M
// ----------------------------------------------------------------------------
// folly_rwspin(4thread_10pct_write)                          444.94ns    2.25M
// shmtx_wr_pri(4thread_10pct_write)                470.35%    94.60ns   10.57M
// shmtx_rd_pri(4thread_10pct_write)                349.08%   127.46ns    7.85M
// folly_ticket(4thread_10pct_write)                305.64%   145.58ns    6.87M
// boost_shared(4thread_10pct_write)                 44.43%     1.00us  998.57K
// pthrd_rwlock(4thread_10pct_write)                100.59%   442.31ns    2.26M
// ----------------------------------------------------------------------------
// folly_rwspin(8thread_10pct_write)                          424.67ns    2.35M
// shmtx_wr_pri(8thread_10pct_write)                337.53%   125.82ns    7.95M
// shmtx_rd_pri(8thread_10pct_write)                232.32%   182.79ns    5.47M
// folly_ticket(8thread_10pct_write)                206.59%   205.56ns    4.86M
// boost_shared(8thread_10pct_write)                 19.45%     2.18us  457.90K
// pthrd_rwlock(8thread_10pct_write)                 78.58%   540.42ns    1.85M
// ----------------------------------------------------------------------------
// folly_rwspin(16thread_10pct_write)                         727.04ns    1.38M
// shmtx_wr_pri(16thread_10pct_write)               400.60%   181.49ns    5.51M
// shmtx_rd_pri(16thread_10pct_write)               312.94%   232.33ns    4.30M
// folly_ticket(16thread_10pct_write)               283.67%   256.30ns    3.90M
// boost_shared(16thread_10pct_write)                15.87%     4.58us  218.32K
// pthrd_rwlock(16thread_10pct_write)               131.28%   553.82ns    1.81M
// ----------------------------------------------------------------------------
// folly_rwspin(32thread_10pct_write)                         810.61ns    1.23M
// shmtx_wr_pri(32thread_10pct_write)               429.61%   188.68ns    5.30M
// shmtx_rd_pri(32thread_10pct_write)               321.13%   252.42ns    3.96M
// folly_ticket(32thread_10pct_write)               247.65%   327.32ns    3.06M
// boost_shared(32thread_10pct_write)                 8.34%     9.71us  102.94K
// pthrd_rwlock(32thread_10pct_write)               144.28%   561.85ns    1.78M
// ----------------------------------------------------------------------------
// folly_rwspin(64thread_10pct_write)                           1.10us  912.30K
// shmtx_wr_pri(64thread_10pct_write)               486.68%   225.22ns    4.44M
// shmtx_rd_pri(64thread_10pct_write)               412.96%   265.43ns    3.77M
// folly_ticket(64thread_10pct_write)               280.23%   391.15ns    2.56M
// boost_shared(64thread_10pct_write)                 6.16%    17.79us   56.22K
// pthrd_rwlock(64thread_10pct_write)               198.81%   551.34ns    1.81M
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// folly_rwspin(1thread_1pct_write)                            19.02ns   52.57M
// shmtx_wr_pri(1thread_1pct_write)                  94.46%    20.14ns   49.66M
// shmtx_w_bare(1thread_1pct_write)                  76.60%    24.83ns   40.27M
// shmtx_rd_pri(1thread_1pct_write)                  93.83%    20.27ns   49.33M
// shmtx_r_bare(1thread_1pct_write)                  77.04%    24.69ns   40.50M
// folly_ticket(1thread_1pct_write)                  72.83%    26.12ns   38.29M
// boost_shared(1thread_1pct_write)                  12.48%   152.44ns    6.56M
// pthrd_rwlock(1thread_1pct_write)                  42.85%    44.39ns   22.53M
// ----------------------------------------------------------------------------
// folly_rwspin(2thread_1pct_write)                           110.63ns    9.04M
// shmtx_wr_pri(2thread_1pct_write)                 442.12%    25.02ns   39.96M
// shmtx_w_bare(2thread_1pct_write)                 374.65%    29.53ns   33.86M
// shmtx_rd_pri(2thread_1pct_write)                 371.08%    29.81ns   33.54M
// shmtx_r_bare(2thread_1pct_write)                 138.02%    80.15ns   12.48M
// folly_ticket(2thread_1pct_write)                 131.34%    84.23ns   11.87M
// boost_shared(2thread_1pct_write)                  30.35%   364.58ns    2.74M
// pthrd_rwlock(2thread_1pct_write)                  95.48%   115.87ns    8.63M
// ----------------------------------------------------------------------------
// folly_rwspin(4thread_1pct_write)                           140.62ns    7.11M
// shmtx_wr_pri(4thread_1pct_write)                 627.13%    22.42ns   44.60M
// shmtx_w_bare(4thread_1pct_write)                 552.94%    25.43ns   39.32M
// shmtx_rd_pri(4thread_1pct_write)                 226.06%    62.21ns   16.08M
// shmtx_r_bare(4thread_1pct_write)                  77.61%   181.19ns    5.52M
// folly_ticket(4thread_1pct_write)                 119.58%   117.60ns    8.50M
// boost_shared(4thread_1pct_write)                  25.36%   554.54ns    1.80M
// pthrd_rwlock(4thread_1pct_write)                  45.55%   308.72ns    3.24M
// ----------------------------------------------------------------------------
// folly_rwspin(8thread_1pct_write)                           166.23ns    6.02M
// shmtx_wr_pri(8thread_1pct_write)                 687.09%    24.19ns   41.33M
// shmtx_w_bare(8thread_1pct_write)                 611.80%    27.17ns   36.80M
// shmtx_rd_pri(8thread_1pct_write)                 140.37%   118.43ns    8.44M
// shmtx_r_bare(8thread_1pct_write)                  80.32%   206.97ns    4.83M
// folly_ticket(8thread_1pct_write)                 117.06%   142.01ns    7.04M
// boost_shared(8thread_1pct_write)                  22.29%   745.67ns    1.34M
// pthrd_rwlock(8thread_1pct_write)                  49.84%   333.55ns    3.00M
// ----------------------------------------------------------------------------
// folly_rwspin(16thread_1pct_write)                          419.79ns    2.38M
// shmtx_wr_pri(16thread_1pct_write)               1397.92%    30.03ns   33.30M
// shmtx_w_bare(16thread_1pct_write)               1324.60%    31.69ns   31.55M
// shmtx_rd_pri(16thread_1pct_write)                278.12%   150.94ns    6.63M
// shmtx_r_bare(16thread_1pct_write)                194.25%   216.11ns    4.63M
// folly_ticket(16thread_1pct_write)                255.38%   164.38ns    6.08M
// boost_shared(16thread_1pct_write)                 33.71%     1.25us  803.01K
// pthrd_rwlock(16thread_1pct_write)                131.96%   318.12ns    3.14M
// ----------------------------------------------------------------------------
// folly_rwspin(32thread_1pct_write)                          395.99ns    2.53M
// shmtx_wr_pri(32thread_1pct_write)               1332.76%    29.71ns   33.66M
// shmtx_w_bare(32thread_1pct_write)               1208.86%    32.76ns   30.53M
// shmtx_rd_pri(32thread_1pct_write)                252.97%   156.54ns    6.39M
// shmtx_r_bare(32thread_1pct_write)                193.79%   204.35ns    4.89M
// folly_ticket(32thread_1pct_write)                173.16%   228.69ns    4.37M
// boost_shared(32thread_1pct_write)                 17.00%     2.33us  429.40K
// pthrd_rwlock(32thread_1pct_write)                129.88%   304.89ns    3.28M
// ----------------------------------------------------------------------------
// folly_rwspin(64thread_1pct_write)                          424.07ns    2.36M
// shmtx_wr_pri(64thread_1pct_write)               1297.89%    32.67ns   30.61M
// shmtx_w_bare(64thread_1pct_write)               1228.88%    34.51ns   28.98M
// shmtx_rd_pri(64thread_1pct_write)                270.40%   156.83ns    6.38M
// shmtx_r_bare(64thread_1pct_write)                218.05%   194.48ns    5.14M
// folly_ticket(64thread_1pct_write)                171.44%   247.36ns    4.04M
// boost_shared(64thread_1pct_write)                 10.60%     4.00us  249.95K
// pthrd_rwlock(64thread_1pct_write)                143.80%   294.91ns    3.39M
// ----------------------------------------------------------------------------
// folly_rwspin(2thr_2lock_50pct_write)                        10.87ns   91.99M
// shmtx_wr_pri(2thr_2lock_50pct_write)              83.71%    12.99ns   77.01M
// shmtx_rd_pri(2thr_2lock_50pct_write)              84.08%    12.93ns   77.34M
// folly_rwspin(4thr_4lock_50pct_write)                         5.32ns  188.12M
// shmtx_wr_pri(4thr_4lock_50pct_write)              82.21%     6.47ns  154.65M
// shmtx_rd_pri(4thr_4lock_50pct_write)              81.20%     6.55ns  152.75M
// folly_rwspin(8thr_8lock_50pct_write)                         2.64ns  379.06M
// shmtx_wr_pri(8thr_8lock_50pct_write)              81.26%     3.25ns  308.03M
// shmtx_rd_pri(8thr_8lock_50pct_write)              80.95%     3.26ns  306.86M
// folly_rwspin(16thr_16lock_50pct_write)                       1.52ns  656.77M
// shmtx_wr_pri(16thr_16lock_50pct_write)            86.24%     1.77ns  566.41M
// shmtx_rd_pri(16thr_16lock_50pct_write)            83.72%     1.82ns  549.82M
// folly_rwspin(32thr_32lock_50pct_write)                       1.19ns  841.03M
// shmtx_wr_pri(32thr_32lock_50pct_write)            85.08%     1.40ns  715.55M
// shmtx_rd_pri(32thr_32lock_50pct_write)            86.44%     1.38ns  727.00M
// folly_rwspin(64thr_64lock_50pct_write)                       1.46ns  684.28M
// shmtx_wr_pri(64thr_64lock_50pct_write)            84.53%     1.73ns  578.43M
// shmtx_rd_pri(64thr_64lock_50pct_write)            82.80%     1.76ns  566.58M
// ----------------------------------------------------------------------------
// folly_rwspin(2thr_2lock_10pct_write)                        10.01ns   99.85M
// shmtx_wr_pri(2thr_2lock_10pct_write)              92.02%    10.88ns   91.88M
// shmtx_rd_pri(2thr_2lock_10pct_write)              92.35%    10.84ns   92.22M
// folly_rwspin(4thr_4lock_10pct_write)                         4.81ns  207.87M
// shmtx_wr_pri(4thr_4lock_10pct_write)              89.32%     5.39ns  185.67M
// shmtx_rd_pri(4thr_4lock_10pct_write)              88.96%     5.41ns  184.93M
// folly_rwspin(8thr_8lock_10pct_write)                         2.39ns  417.62M
// shmtx_wr_pri(8thr_8lock_10pct_write)              91.17%     2.63ns  380.76M
// shmtx_rd_pri(8thr_8lock_10pct_write)              89.53%     2.67ns  373.92M
// folly_rwspin(16thr_16lock_10pct_write)                       1.16ns  860.47M
// shmtx_wr_pri(16thr_16lock_10pct_write)            74.35%     1.56ns  639.77M
// shmtx_rd_pri(16thr_16lock_10pct_write)            91.34%     1.27ns  785.97M
// folly_rwspin(32thr_32lock_10pct_write)                       1.15ns  866.23M
// shmtx_wr_pri(32thr_32lock_10pct_write)            92.32%     1.25ns  799.72M
// shmtx_rd_pri(32thr_32lock_10pct_write)            94.40%     1.22ns  817.71M
// folly_rwspin(64thr_64lock_10pct_write)                       1.41ns  710.54M
// shmtx_wr_pri(64thr_64lock_10pct_write)            94.14%     1.50ns  668.88M
// shmtx_rd_pri(64thr_64lock_10pct_write)            94.80%     1.48ns  673.56M
// ----------------------------------------------------------------------------
// folly_rwspin(2thr_2lock_1pct_write)                          9.58ns  104.36M
// shmtx_wr_pri(2thr_2lock_1pct_write)               92.00%    10.42ns   96.01M
// shmtx_rd_pri(2thr_2lock_1pct_write)               91.79%    10.44ns   95.79M
// folly_rwspin(4thr_4lock_1pct_write)                          4.71ns  212.30M
// shmtx_wr_pri(4thr_4lock_1pct_write)               90.37%     5.21ns  191.85M
// shmtx_rd_pri(4thr_4lock_1pct_write)               89.94%     5.24ns  190.95M
// folly_rwspin(8thr_8lock_1pct_write)                          2.33ns  429.91M
// shmtx_wr_pri(8thr_8lock_1pct_write)               90.67%     2.57ns  389.80M
// shmtx_rd_pri(8thr_8lock_1pct_write)               90.61%     2.57ns  389.55M
// folly_rwspin(16thr_16lock_1pct_write)                        1.10ns  905.23M
// shmtx_wr_pri(16thr_16lock_1pct_write)             91.96%     1.20ns  832.46M
// shmtx_rd_pri(16thr_16lock_1pct_write)             92.29%     1.20ns  835.42M
// folly_rwspin(32thr_32lock_1pct_write)                        1.14ns  879.85M
// shmtx_wr_pri(32thr_32lock_1pct_write)             93.41%     1.22ns  821.86M
// shmtx_rd_pri(32thr_32lock_1pct_write)             94.18%     1.21ns  828.66M
// folly_rwspin(64thr_64lock_1pct_write)                        1.34ns  748.83M
// shmtx_wr_pri(64thr_64lock_1pct_write)             94.39%     1.41ns  706.84M
// shmtx_rd_pri(64thr_64lock_1pct_write)             94.02%     1.42ns  704.06M
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// folly_rwspin_ping_pong(burn0)                              605.63ns    1.65M
// shmtx_w_bare_ping_pong(burn0)                    102.17%   592.76ns    1.69M
// shmtx_r_bare_ping_pong(burn0)                     88.75%   682.44ns    1.47M
// folly_ticket_ping_pong(burn0)                     63.92%   947.56ns    1.06M
// boost_shared_ping_pong(burn0)                      8.52%     7.11us  140.73K
// pthrd_rwlock_ping_pong(burn0)                      7.88%     7.68us  130.15K
// ----------------------------------------------------------------------------
// folly_rwspin_ping_pong(burn100k)                           727.76ns    1.37M
// shmtx_w_bare_ping_pong(burn100k)                 100.79%   722.09ns    1.38M
// shmtx_r_bare_ping_pong(burn100k)                 101.98%   713.61ns    1.40M
// folly_ticket_ping_pong(burn100k)                 102.80%   707.95ns    1.41M
// boost_shared_ping_pong(burn100k)                  81.49%   893.02ns    1.12M
// pthrd_rwlock_ping_pong(burn100k)                  71.05%     1.02us  976.30K
// ----------------------------------------------------------------------------
// folly_rwspin_ping_pong(burn300k)                             2.11us  473.46K
// shmtx_w_bare_ping_pong(burn300k)                 100.06%     2.11us  473.72K
// shmtx_r_bare_ping_pong(burn300k)                  98.93%     2.13us  468.39K
// folly_ticket_ping_pong(burn300k)                  96.68%     2.18us  457.73K
// boost_shared_ping_pong(burn300k)                  84.72%     2.49us  401.13K
// pthrd_rwlock_ping_pong(burn300k)                  84.62%     2.50us  400.66K
// ----------------------------------------------------------------------------
// folly_rwspin_ping_pong(burn1M)                             709.70ns    1.41M
// shmtx_w_bare_ping_pong(burn1M)                   100.28%   707.73ns    1.41M
// shmtx_r_bare_ping_pong(burn1M)                    99.63%   712.37ns    1.40M
// folly_ticket_ping_pong(burn1M)                   100.09%   709.05ns    1.41M
// boost_shared_ping_pong(burn1M)                    94.09%   754.29ns    1.33M
// pthrd_rwlock_ping_pong(burn1M)                    96.32%   736.82ns    1.36M
// ============================================================================

int main(int argc, char** argv) {
  (void)folly_rwspin_reads;
  (void)shmtx_wr_pri_reads;
  (void)shmtx_w_bare_reads;
  (void)shmtx_rd_pri_reads;
  (void)shmtx_r_bare_reads;
  (void)folly_ticket_reads;
  (void)boost_shared_reads;
  (void)pthrd_rwlock_reads;
  (void)folly_rwspin;
  (void)shmtx_wr_pri;
  (void)shmtx_w_bare;
  (void)shmtx_rd_pri;
  (void)shmtx_r_bare;
  (void)folly_ticket;
  (void)boost_shared;
  (void)pthrd_rwlock;
  (void)pthrd_mutex_;
  (void)folly_rwspin_ping_pong;
  (void)shmtx_w_bare_ping_pong;
  (void)shmtx_r_bare_ping_pong;
  (void)folly_ticket_ping_pong;
  (void)boost_shared_ping_pong;
  (void)pthrd_rwlock_ping_pong;

  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  int rv = RUN_ALL_TESTS();
  folly::runBenchmarksOnFlag();
  return rv;
}
