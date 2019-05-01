/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/Synchronized.h>
#include <folly/Function.h>
#include <folly/LockTraitsBoost.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/SharedMutex.h>
#include <folly/SpinLock.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/RWSpinLock.h>
#include <folly/test/SynchronizedTestLib.h>

using namespace folly::sync_tests;

namespace folly {

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

TYPED_TEST(SynchronizedTest, InPlaceConstruction) {
  testInPlaceConstruction<TypeParam>();
}

TYPED_TEST(SynchronizedTest, Exchange) {
  testExchange<TypeParam>();
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
    SynchronizedTimedWithConstTest,
    SynchronizedTimedWithConstTestTypes);

TYPED_TEST(SynchronizedTimedWithConstTest, TimedShared) {
  testTimedShared<TypeParam>();
}

TYPED_TEST(SynchronizedTimedWithConstTest, TimedSynchronizeWithConst) {
  testTimedSynchronizedWithConst<TypeParam>();
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

class NonDefaultConstructibleMutex {
 public:
  explicit NonDefaultConstructibleMutex(int valueIn) {
    value = valueIn;
  }
  NonDefaultConstructibleMutex() = delete;
  NonDefaultConstructibleMutex(const NonDefaultConstructibleMutex&) = delete;
  NonDefaultConstructibleMutex(NonDefaultConstructibleMutex&&) = delete;
  NonDefaultConstructibleMutex& operator=(const NonDefaultConstructibleMutex&) =
      delete;
  NonDefaultConstructibleMutex& operator=(NonDefaultConstructibleMutex&&) =
      delete;

  static int value;

  void lock() {}
  void unlock() {}
};
int NonDefaultConstructibleMutex::value{0};

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

TEST_F(SynchronizedLockTest, TestPieceWiseConstruct) {
  auto&& synchronized = folly::Synchronized<int, NonDefaultConstructibleMutex>{
      std::piecewise_construct,
      std::forward_as_tuple(3),
      std::forward_as_tuple(1)};

  EXPECT_EQ(*synchronized.lock(), 3);
  EXPECT_EQ(NonDefaultConstructibleMutex::value, 1);
}

namespace {
constexpr auto kLockable = 1;
constexpr auto kWLockable = 2;
constexpr auto kRLockable = 4;
constexpr auto kULockable = 8;

template <int kLockableType>
class TryLockable {
 public:
  explicit TryLockable(
      bool shouldSucceed,
      folly::Function<void()> onLockIn,
      folly::Function<void()> onUnlockIn)
      : kShouldSucceed{shouldSucceed},
        onLock{std::move(onLockIn)},
        onUnlock{std::move(onUnlockIn)} {}

  void lock() {
    EXPECT_TRUE(false);
  }
  template <
      int LockableType = kLockableType,
      std::enable_if_t<LockableType != kLockable>* = nullptr>
  void lock_shared() {
    EXPECT_TRUE(false);
  }
  template <
      int LockableType = kLockableType,
      std::enable_if_t<LockableType == kULockable>* = nullptr>
  void lock_upgrade() {
    EXPECT_TRUE(false);
  }

  bool tryLockImpl(int lockableMask) {
    // if the lockable type of this instance is one of the possible options as
    // expressed in the mask go through the usual test code
    if (kLockableType | lockableMask) {
      if (kShouldSucceed) {
        onLock();
        return true;
      } else {
        return false;
      }
    }

    // else fail the test
    EXPECT_TRUE(false);
    return false;
  }
  void unlockImpl(int lockableMask) {
    if (kLockableType | lockableMask) {
      onUnlock();
      return;
    }

    EXPECT_TRUE(false);
  }

  bool try_lock() {
    return tryLockImpl(kLockable | kWLockable);
  }
  bool try_lock_shared() {
    return tryLockImpl(kRLockable);
  }
  bool try_lock_upgrade() {
    return tryLockImpl(kULockable);
  }

  void unlock() {
    unlockImpl(kLockable | kWLockable);
  }
  void unlock_shared() {
    unlockImpl(kLockable | kRLockable);
  }
  void unlock_upgrade() {
    unlockImpl(kLockable | kULockable);
  }

  const bool kShouldSucceed;
  folly::Function<void()> onLock;
  folly::Function<void()> onUnlock;
};

struct TestSharedMutex {
 public:
  void lock() {
    onLock_();
  }
  void unlock() {
    onUnlock_();
  }
  void lock_shared() {
    onLockShared_();
  }
  void unlock_shared() {
    onUnlockShared_();
  }

  bool try_lock() {
    onLock_();
    return true;
  }
  bool try_lock_shared() {
    onLockShared_();
    return true;
  }

  std::function<void()> onLock_;
  std::function<void()> onUnlock_;
  std::function<void()> onLockShared_;
  std::function<void()> onUnlockShared_;
};

struct TestMutex {
 public:
  void lock() {
    onLock();
    ++numTimesLocked;
  }
  bool try_lock() {
    if (shouldTryLockSucceed) {
      lock();
      return true;
    }
    return false;
  }
  void unlock() {
    onUnlock();
    ++numTimesUnlocked;
  }

  int numTimesLocked{0};
  int numTimesUnlocked{0};
  bool shouldTryLockSucceed{true};
  std::function<void()> onLock{[] {}};
  std::function<void()> onUnlock{[] {}};
};

template <int kLockable, typename Func>
void testTryLock(Func func) {
  {
    auto locked = 0;
    auto unlocked = 0;
    folly::Synchronized<int, TryLockable<kLockable>> synchronized{
        std::piecewise_construct,
        std::make_tuple(),
        std::make_tuple(true, [&] { ++locked; }, [&] { ++unlocked; })};

    {
      auto lock = func(synchronized);
      EXPECT_TRUE(lock);
      EXPECT_EQ(locked, 1);
    }
    EXPECT_EQ(locked, 1);
    EXPECT_EQ(unlocked, 1);
  }
  {
    auto locked = 0;
    auto unlocked = 0;
    folly::Synchronized<int, TryLockable<kLockable>> synchronized{
        std::piecewise_construct,
        std::make_tuple(),
        std::make_tuple(false, [&] { ++locked; }, [&] { ++unlocked; })};

    {
      auto lock = func(synchronized);
      EXPECT_FALSE(lock);
      EXPECT_EQ(locked, 0);
    }
    EXPECT_EQ(locked, 0);
    EXPECT_EQ(unlocked, 0);
  }
}

class MutexTrack {
 public:
  static int gId;
  static int gOrder;

  void lock_shared() {}
  void unlock_shared() {}
  void lock() {
    order = MutexTrack::gOrder++;
  }
  void unlock() {
    order = -1;
    --gOrder;
  }

  int current{gId++};
  int order{-1};
};
int MutexTrack::gId{0};
int MutexTrack::gOrder{0};
} // namespace

TEST_F(SynchronizedLockTest, TestTryLock) {
  testTryLock<kLockable>(
      [](auto& synchronized) { return synchronized.tryLock(); });
}

TEST_F(SynchronizedLockTest, TestTryWLock) {
  testTryLock<kWLockable>(
      [](auto& synchronized) { return synchronized.tryWLock(); });
}

TEST_F(SynchronizedLockTest, TestTryRLock) {
  testTryLock<kRLockable>(
      [](auto& synchronized) { return synchronized.tryRLock(); });
}

TEST_F(SynchronizedLockTest, TestTryULock) {
  testTryLock<kULockable>(
      [](auto& synchronized) { return synchronized.tryULock(); });
}

template <typename LockPolicy>
using LPtr = LockedPtr<Synchronized<int>, LockPolicy>;

namespace {
template <template <typename...> class Trait>
void testLockedPtrCompatibilityExclusive() {
  EXPECT_TRUE((
      Trait<LPtr<LockPolicyExclusive>, LPtr<LockPolicyTryExclusive>&&>::value));
  EXPECT_TRUE((Trait<
               LPtr<LockPolicyExclusive>,
               LPtr<LockPolicyFromUpgradeToExclusive>&&>::value));

  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyExclusive>&, LPtr<LockPolicyShared>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyExclusive>, LPtr<LockPolicyTryShared>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyExclusive>, LPtr<LockPolicyUpgrade>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyExclusive>, LPtr<LockPolicyTryUpgrade>&&>::value));
  EXPECT_FALSE((Trait<
                LPtr<LockPolicyExclusive>,
                LPtr<LockPolicyFromExclusiveToUpgrade>&&>::value));
  EXPECT_FALSE((Trait<
                LPtr<LockPolicyExclusive>,
                LPtr<LockPolicyFromExclusiveToShared>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyExclusive>, LPtr<LockPolicyFromUpgradeToShared>&&>::
           value));
}

template <template <typename...> class Trait>
void testLockedPtrCompatibilityShared() {
  EXPECT_TRUE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyTryShared>&&>::value));
  EXPECT_TRUE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyFromUpgradeToShared>&&>::
           value));
  EXPECT_TRUE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyFromExclusiveToShared>&&>::
           value));

  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyExclusive>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyTryExclusive>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyUpgrade>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyTryUpgrade>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyFromExclusiveToUpgrade>&&>::
           value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyShared>, LPtr<LockPolicyFromUpgradeToExclusive>&&>::
           value));
}

template <template <typename...> class Trait>
void testLockedPtrCompatibilityUpgrade() {
  EXPECT_TRUE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyTryUpgrade>&&>::value));
  EXPECT_TRUE((
      Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyFromExclusiveToUpgrade>&&>::
          value));

  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyExclusive>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyTryExclusive>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyShared>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyTryShared>&&>::value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyFromExclusiveToShared>&&>::
           value));
  EXPECT_FALSE(
      (Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyFromUpgradeToShared>&&>::
           value));
  EXPECT_FALSE((
      Trait<LPtr<LockPolicyUpgrade>, LPtr<LockPolicyFromUpgradeToExclusive>&&>::
          value));
}
} // namespace

TEST_F(SynchronizedLockTest, TestLockedPtrCompatibilityExclusive) {
  testLockedPtrCompatibilityExclusive<std::is_assignable>();
  testLockedPtrCompatibilityExclusive<std::is_constructible>();
}

TEST_F(SynchronizedLockTest, TestLockedPtrCompatibilityShared) {
  testLockedPtrCompatibilityShared<std::is_assignable>();
  testLockedPtrCompatibilityShared<std::is_constructible>();
}

TEST_F(SynchronizedLockTest, TestLockedPtrCompatibilityUpgrade) {
  testLockedPtrCompatibilityUpgrade<std::is_assignable>();
  testLockedPtrCompatibilityUpgrade<std::is_constructible>();
}

TEST_F(SynchronizedLockTest, TestConvertTryLockToLock) {
  auto synchronized = folly::Synchronized<int>{0};
  auto wlock = synchronized.wlock();
  wlock.unlock();

  auto ulock = synchronized.ulock();
  wlock = ulock.moveFromUpgradeToWrite();
  wlock.unlock();

  auto value = synchronized.withWLock([](auto& integer) { return integer; });
  EXPECT_EQ(value, 0);
}

TEST(FollyLockTest, TestVariadicLockWithSynchronized) {
  {
    auto syncs = std::array<folly::Synchronized<int>, 3>{};
    auto& one = syncs[0];
    auto const& two = syncs[1];
    auto& three = syncs[2];
    auto locks =
        lock(folly::wlock(one), folly::rlock(two), folly::wlock(three));
    EXPECT_TRUE(std::get<0>(locks));
    EXPECT_TRUE(std::get<1>(locks));
    EXPECT_TRUE(std::get<2>(locks));
  }
  {
    auto syncs = std::array<folly::Synchronized<int, std::mutex>, 2>{};
    auto locks = lock(folly::lock(syncs[0]), folly::lock(syncs[1]));
    EXPECT_TRUE(std::get<0>(locks));
    EXPECT_TRUE(std::get<1>(locks));
  }
}

TEST(FollyLockTest, TestVariadicLockWithArbitraryLockables) {
  auto&& one = std::mutex{};
  auto&& two = std::mutex{};

  auto lckOne = std::unique_lock<std::mutex>{one, std::defer_lock};
  auto lckTwo = std::unique_lock<std::mutex>{two, std::defer_lock};
  folly::lock(lckOne, lckTwo);
  EXPECT_TRUE(lckOne);
  EXPECT_TRUE(lckTwo);
}

TEST(FollyLockTest, TestVariadicLockSmartAndPoliteAlgorithm) {
  auto one = TestMutex{};
  auto two = TestMutex{};
  auto three = TestMutex{};
  auto makeReset = [&] {
    return folly::makeGuard([&] {
      one = TestMutex{};
      two = TestMutex{};
      three = TestMutex{};
    });
  };

  {
    auto reset = makeReset();
    folly::lock(one, two, three);
    EXPECT_EQ(one.numTimesLocked, 1);
    EXPECT_EQ(one.numTimesUnlocked, 0);
    EXPECT_EQ(two.numTimesLocked, 1);
    EXPECT_EQ(two.numTimesUnlocked, 0);
    EXPECT_EQ(three.numTimesLocked, 1);
    EXPECT_EQ(three.numTimesUnlocked, 0);
  }

  {
    auto reset = makeReset();
    two.shouldTryLockSucceed = false;
    folly::lock(one, two, three);
    EXPECT_EQ(one.numTimesLocked, 2);
    EXPECT_EQ(one.numTimesUnlocked, 1);
    EXPECT_EQ(two.numTimesLocked, 1);
    EXPECT_EQ(two.numTimesUnlocked, 0);
    EXPECT_EQ(three.numTimesLocked, 1);
    EXPECT_EQ(three.numTimesUnlocked, 0);
  }

  {
    auto reset = makeReset();
    three.shouldTryLockSucceed = false;
    folly::lock(one, two, three);
    EXPECT_EQ(one.numTimesLocked, 2);
    EXPECT_EQ(one.numTimesUnlocked, 1);
    EXPECT_EQ(two.numTimesLocked, 2);
    EXPECT_EQ(two.numTimesUnlocked, 1);
    EXPECT_EQ(three.numTimesLocked, 1);
    EXPECT_EQ(three.numTimesUnlocked, 0);
  }

  {
    auto reset = makeReset();
    three.shouldTryLockSucceed = false;

    three.onLock = [&] {
      // when three gets locked make one fail
      one.shouldTryLockSucceed = false;
      // then when one gets locked make three succeed to finish the test
      one.onLock = [&] { three.shouldTryLockSucceed = true; };
    };

    folly::lock(one, two, three);
    EXPECT_EQ(one.numTimesLocked, 2);
    EXPECT_EQ(one.numTimesUnlocked, 1);
    EXPECT_EQ(two.numTimesLocked, 2);
    EXPECT_EQ(two.numTimesUnlocked, 1);
    EXPECT_EQ(three.numTimesLocked, 2);
    EXPECT_EQ(three.numTimesUnlocked, 1);
  }
}

TEST(SynchronizedAlgorithmTest, Basic) {
  auto sync = Synchronized<int>{0};
  auto value = synchronized([](auto s) { return *s; }, wlock(sync));
  EXPECT_EQ(value, 0);
}

TEST(SynchronizedAlgorithmTest, BasicNonShareableMutex) {
  auto sync = Synchronized<int, std::mutex>{0};
  auto value = synchronized([](auto s) { return *s; }, lock(sync));
  EXPECT_EQ(value, 0);
}

TEST(Synchronized, SynchronizedFunctionNonConst) {
  auto locked = 0;
  auto unlocked = 0;
  auto sync = Synchronized<int, TestSharedMutex>{
      std::piecewise_construct,
      std::make_tuple(0),
      std::make_tuple([&] { ++locked; }, [&] { ++unlocked; }, [] {}, [] {})};

  synchronized([](auto) {}, wlock(sync));
  EXPECT_EQ(locked, 1);
  EXPECT_EQ(unlocked, 1);
}

TEST(Synchronized, SynchronizedFunctionConst) {
  auto locked = 0;
  auto unlocked = 0;
  auto sync = Synchronized<int, TestSharedMutex>{
      std::piecewise_construct,
      std::make_tuple(0),
      std::make_tuple([] {}, [] {}, [&] { ++locked; }, [&] { ++unlocked; })};

  synchronized([](auto) {}, rlock(sync));
  EXPECT_EQ(locked, 1);
  EXPECT_EQ(unlocked, 1);
}

TEST(Synchronized, SynchronizedFunctionManyObjects) {
  auto fail = [] { EXPECT_TRUE(false); };
  auto pass = [] {};

  auto one = Synchronized<int, TestSharedMutex>{
      std::piecewise_construct,
      std::make_tuple(0),
      std::make_tuple(pass, pass, fail, fail)};
  auto two = Synchronized<std::string, TestSharedMutex>{
      std::piecewise_construct,
      std::make_tuple(),
      std::make_tuple(fail, fail, pass, pass)};

  synchronized([](auto, auto) {}, wlock(one), rlock(two));
}

} // namespace folly
