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

// @author: Andrei Alexandrescu (aalexandre)

// Test bed for folly/Synchronized.h

#include <folly/LockTraitsBoost.h>
#include <folly/Portability.h>
#include <folly/RWSpinLock.h>
#include <folly/SharedMutex.h>
#include <folly/SpinLock.h>
#include <folly/Synchronized.h>
#include <folly/test/SynchronizedTestLib.h>
#include <folly/portability/GTest.h>

using namespace folly::sync_tests;

template <class Mutex>
class SynchronizedTest : public testing::Test {};

using SynchronizedTestTypes = testing::Types<
    folly::SharedMutexReadPriority,
    folly::SharedMutexWritePriority,
    std::mutex,
    std::recursive_mutex,
#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
    std::timed_mutex,
    std::recursive_timed_mutex,
#endif
    boost::mutex,
    boost::recursive_mutex,
#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
    boost::timed_mutex,
    boost::recursive_timed_mutex,
#endif
#ifdef RW_SPINLOCK_USE_X86_INTRINSIC_
    folly::RWTicketSpinLock32,
    folly::RWTicketSpinLock64,
#endif
    boost::shared_mutex,
    folly::SpinLock>;
TYPED_TEST_CASE(SynchronizedTest, SynchronizedTestTypes);

TYPED_TEST(SynchronizedTest, Basic) {
  testBasic<TypeParam>();
}

TYPED_TEST(SynchronizedTest, WithLock) {
  testWithLock<TypeParam>();
}

TYPED_TEST(SynchronizedTest, Unlock) {
  testUnlock<TypeParam>();
}

TYPED_TEST(SynchronizedTest, Deprecated) {
  testDeprecated<TypeParam>();
}

TYPED_TEST(SynchronizedTest, Concurrency) {
  testConcurrency<TypeParam>();
}

TYPED_TEST(SynchronizedTest, AcquireLocked) {
  testAcquireLocked<TypeParam>();
}

TYPED_TEST(SynchronizedTest, AcquireLockedWithConst) {
  testAcquireLockedWithConst<TypeParam>();
}

TYPED_TEST(SynchronizedTest, DualLocking) {
  testDualLocking<TypeParam>();
}

TYPED_TEST(SynchronizedTest, DualLockingWithConst) {
  testDualLockingWithConst<TypeParam>();
}

TYPED_TEST(SynchronizedTest, ConstCopy) {
  testConstCopy<TypeParam>();
}

template <class Mutex>
class SynchronizedTimedTest : public testing::Test {};

using SynchronizedTimedTestTypes = testing::Types<
#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
    std::timed_mutex,
    std::recursive_timed_mutex,
    boost::timed_mutex,
    boost::recursive_timed_mutex,
    boost::shared_mutex,
#endif
#ifdef RW_SPINLOCK_USE_X86_INTRINSIC_
    folly::RWTicketSpinLock32,
    folly::RWTicketSpinLock64,
#endif
    folly::SharedMutexReadPriority,
    folly::SharedMutexWritePriority>;
TYPED_TEST_CASE(SynchronizedTimedTest, SynchronizedTimedTestTypes);

TYPED_TEST(SynchronizedTimedTest, Timed) {
  testTimed<TypeParam>();
}

TYPED_TEST(SynchronizedTimedTest, TimedSynchronized) {
  testTimedSynchronized<TypeParam>();
}

template <class Mutex>
class SynchronizedTimedWithConstTest : public testing::Test {};

using SynchronizedTimedWithConstTestTypes = testing::Types<
#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
    boost::shared_mutex,
#endif
#ifdef RW_SPINLOCK_USE_X86_INTRINSIC_
    folly::RWTicketSpinLock32,
    folly::RWTicketSpinLock64,
#endif
    folly::SharedMutexReadPriority,
    folly::SharedMutexWritePriority>;
TYPED_TEST_CASE(
    SynchronizedTimedWithConstTest, SynchronizedTimedWithConstTestTypes);

TYPED_TEST(SynchronizedTimedWithConstTest, TimedShared) {
  testTimedShared<TypeParam>();
}

TYPED_TEST(SynchronizedTimedWithConstTest, TimedSynchronizeWithConst) {
  testTimedSynchronizedWithConst<TypeParam>();
}

TYPED_TEST(SynchronizedTest, InPlaceConstruction) {
  testInPlaceConstruction<TypeParam>();
}

using CountPair = std::pair<int, int>;
// This class is specialized only to be uesed in SynchronizedLockTest
class FakeMutex {
 public:
  void lock() {
    ++lockCount_;
  }

  void unlock() {
    ++unlockCount_;
  }

  static CountPair getLockUnlockCount() {
    return CountPair{lockCount_, unlockCount_};
  }

  static void resetLockUnlockCount() {
    lockCount_ = 0;
    unlockCount_ = 0;
  }
 private:
  // Keep these two static for test access
  // Keep them thread_local in case of tests are run in parallel within one
  // process
  static FOLLY_TLS int lockCount_;
  static FOLLY_TLS int unlockCount_;
};
FOLLY_TLS int FakeMutex::lockCount_{0};
FOLLY_TLS int FakeMutex::unlockCount_{0};

// SynchronizedLockTest is used to verify the correct lock unlock behavior
// happens per design
class SynchronizedLockTest : public testing::Test {
 public:
  void SetUp() override {
    FakeMutex::resetLockUnlockCount();
  }
};

/**
 * Test mutex to help to automate assertions, taken from LockTraitsTest.cpp
 */
class FakeAllPowerfulAssertingMutexInternal {
 public:
  enum class CurrentLockState { UNLOCKED, SHARED, UPGRADE, UNIQUE };

  void lock() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNLOCKED);
    this->lock_state = CurrentLockState::UNIQUE;
  }
  void unlock() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNIQUE);
    this->lock_state = CurrentLockState::UNLOCKED;
  }
  void lock_shared() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNLOCKED);
    this->lock_state = CurrentLockState::SHARED;
  }
  void unlock_shared() {
    EXPECT_EQ(this->lock_state, CurrentLockState::SHARED);
    this->lock_state = CurrentLockState::UNLOCKED;
  }
  void lock_upgrade() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNLOCKED);
    this->lock_state = CurrentLockState::UPGRADE;
  }
  void unlock_upgrade() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UPGRADE);
    this->lock_state = CurrentLockState::UNLOCKED;
  }

  void unlock_upgrade_and_lock() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UPGRADE);
    this->lock_state = CurrentLockState::UNIQUE;
  }
  void unlock_and_lock_upgrade() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNIQUE);
    this->lock_state = CurrentLockState::UPGRADE;
  }
  void unlock_and_lock_shared() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNIQUE);
    this->lock_state = CurrentLockState::SHARED;
  }
  void unlock_upgrade_and_lock_shared() {
    EXPECT_EQ(this->lock_state, CurrentLockState::UPGRADE);
    this->lock_state = CurrentLockState::SHARED;
  }

  template <class Rep, class Period>
  bool try_lock_for(const std::chrono::duration<Rep, Period>&) {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNLOCKED);
    this->lock_state = CurrentLockState::UNIQUE;
    return true;
  }

  template <class Rep, class Period>
  bool try_lock_upgrade_for(const std::chrono::duration<Rep, Period>&) {
    EXPECT_EQ(this->lock_state, CurrentLockState::UNLOCKED);
    this->lock_state = CurrentLockState::UPGRADE;
    return true;
  }

  template <class Rep, class Period>
  bool try_unlock_upgrade_and_lock_for(
      const std::chrono::duration<Rep, Period>&) {
    EXPECT_EQ(this->lock_state, CurrentLockState::UPGRADE);
    this->lock_state = CurrentLockState::UNIQUE;
    return true;
  }

  /*
   * Initialize the FakeMutex with an unlocked state
   */
  CurrentLockState lock_state{CurrentLockState::UNLOCKED};
};

/**
 * The following works around the internal mutex for synchronized being
 * private
 *
 * This is horridly thread unsafe.
 */
static FakeAllPowerfulAssertingMutexInternal globalAllPowerfulAssertingMutex;

class FakeAllPowerfulAssertingMutex {
 public:
  void lock() {
    globalAllPowerfulAssertingMutex.lock();
  }
  void unlock() {
    globalAllPowerfulAssertingMutex.unlock();
  }
  void lock_shared() {
    globalAllPowerfulAssertingMutex.lock_shared();
  }
  void unlock_shared() {
    globalAllPowerfulAssertingMutex.unlock_shared();
  }
  void lock_upgrade() {
    globalAllPowerfulAssertingMutex.lock_upgrade();
  }
  void unlock_upgrade() {
    globalAllPowerfulAssertingMutex.unlock_upgrade();
  }

  void unlock_upgrade_and_lock() {
    globalAllPowerfulAssertingMutex.unlock_upgrade_and_lock();
  }
  void unlock_and_lock_upgrade() {
    globalAllPowerfulAssertingMutex.unlock_and_lock_upgrade();
  }
  void unlock_and_lock_shared() {
    globalAllPowerfulAssertingMutex.unlock_and_lock_shared();
  }
  void unlock_upgrade_and_lock_shared() {
    globalAllPowerfulAssertingMutex.unlock_upgrade_and_lock_shared();
  }

  template <class Rep, class Period>
  bool try_lock_for(const std::chrono::duration<Rep, Period>& arg) {
    return globalAllPowerfulAssertingMutex.try_lock_for(arg);
  }

  template <class Rep, class Period>
  bool try_lock_upgrade_for(const std::chrono::duration<Rep, Period>& arg) {
    return globalAllPowerfulAssertingMutex.try_lock_upgrade_for(arg);
  }

  template <class Rep, class Period>
  bool try_unlock_upgrade_and_lock_for(
      const std::chrono::duration<Rep, Period>& arg) {
    return globalAllPowerfulAssertingMutex.try_unlock_upgrade_and_lock_for(arg);
  }

  // reset state on destruction
  ~FakeAllPowerfulAssertingMutex() {
    globalAllPowerfulAssertingMutex = FakeAllPowerfulAssertingMutexInternal{};
  }
};

TEST_F(SynchronizedLockTest, TestCopyConstructibleValues) {
  struct NonCopyConstructible {
    NonCopyConstructible(const NonCopyConstructible&) = delete;
    NonCopyConstructible& operator=(const NonCopyConstructible&) = delete;
  };
  struct CopyConstructible {};
  EXPECT_FALSE(std::is_copy_constructible<
               folly::Synchronized<NonCopyConstructible>>::value);
  EXPECT_FALSE(std::is_copy_assignable<
               folly::Synchronized<NonCopyConstructible>>::value);
  EXPECT_TRUE(std::is_copy_constructible<
              folly::Synchronized<CopyConstructible>>::value);
  EXPECT_TRUE(
      std::is_copy_assignable<folly::Synchronized<CopyConstructible>>::value);
}

TEST_F(SynchronizedLockTest, UpgradableLocking) {
  folly::Synchronized<int, FakeAllPowerfulAssertingMutex> sync;

  // sanity assert
  static_assert(
      std::is_same<std::decay<decltype(*sync.ulock())>::type, int>::value,
      "The ulock function was not well configured, blame aary@instagram.com");

  {
    auto ulock = sync.ulock();
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UPGRADE);
  }

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test going from upgrade to exclusive
  {
    auto ulock = sync.ulock();
    auto wlock = ulock.moveFromUpgradeToWrite();
    EXPECT_EQ(static_cast<bool>(ulock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNIQUE);
  }

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test going from upgrade to shared
  {
    auto ulock = sync.ulock();
    auto slock = ulock.moveFromUpgradeToRead();
    EXPECT_EQ(static_cast<bool>(ulock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::SHARED);
  }

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test going from exclusive to upgrade
  {
    auto wlock = sync.wlock();
    auto ulock = wlock.moveFromWriteToUpgrade();
    EXPECT_EQ(static_cast<bool>(wlock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UPGRADE);
  }

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test going from exclusive to shared
  {
    auto wlock = sync.wlock();
    auto slock = wlock.moveFromWriteToRead();
    EXPECT_EQ(static_cast<bool>(wlock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::SHARED);
  }

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);
}

TEST_F(SynchronizedLockTest, UpgradableLockingWithULock) {
  folly::Synchronized<int, FakeAllPowerfulAssertingMutex> sync;

  // sanity assert
  static_assert(
      std::is_same<std::decay<decltype(*sync.ulock())>::type, int>::value,
      "The ulock function was not well configured, blame aary@instagram.com");

  // test from upgrade to write
  sync.withULockPtr([](auto ulock) {
    EXPECT_EQ(static_cast<bool>(ulock), true);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UPGRADE);

    auto wlock = ulock.moveFromUpgradeToWrite();
    EXPECT_EQ(static_cast<bool>(ulock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNIQUE);
  });

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test from write to upgrade
  sync.withWLockPtr([](auto wlock) {
    EXPECT_EQ(static_cast<bool>(wlock), true);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNIQUE);

    auto ulock = wlock.moveFromWriteToUpgrade();
    EXPECT_EQ(static_cast<bool>(wlock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UPGRADE);
  });

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test from upgrade to shared
  sync.withULockPtr([](auto ulock) {
    EXPECT_EQ(static_cast<bool>(ulock), true);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UPGRADE);

    auto slock = ulock.moveFromUpgradeToRead();
    EXPECT_EQ(static_cast<bool>(ulock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::SHARED);
  });

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);

  // test from write to shared
  sync.withWLockPtr([](auto wlock) {
    EXPECT_EQ(static_cast<bool>(wlock), true);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNIQUE);

    auto slock = wlock.moveFromWriteToRead();
    EXPECT_EQ(static_cast<bool>(wlock), false);
    EXPECT_EQ(
        globalAllPowerfulAssertingMutex.lock_state,
        FakeAllPowerfulAssertingMutexInternal::CurrentLockState::SHARED);
  });

  // should be unlocked here
  EXPECT_EQ(
      globalAllPowerfulAssertingMutex.lock_state,
      FakeAllPowerfulAssertingMutexInternal::CurrentLockState::UNLOCKED);
}
