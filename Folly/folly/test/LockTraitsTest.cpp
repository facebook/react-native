/*
 * Copyright 2016-present Facebook, Inc.
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
#include <folly/LockTraits.h>
#include <folly/LockTraitsBoost.h>

#include <mutex>

#include <folly/SharedMutex.h>
#include <folly/SpinLock.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/RWSpinLock.h>

using namespace folly;

static constexpr auto one_ms = std::chrono::milliseconds(1);

/**
 * Test mutex to help to automate assertions
 */
class FakeAllPowerfulAssertingMutex {
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

TEST(LockTraits, std_mutex) {
  using traits = LockTraits<std::mutex>;
  static_assert(!traits::is_timed, "std:mutex is not a timed lock");
  static_assert(!traits::is_shared, "std:mutex is not a shared lock");
  static_assert(!traits::is_upgrade, "std::mutex is not an upgradable lock");

  std::mutex mutex;
  traits::lock(mutex);
  traits::unlock(mutex);
}

TEST(LockTraits, SharedMutex) {
  using traits = LockTraits<SharedMutex>;
  static_assert(traits::is_timed, "folly::SharedMutex is a timed lock");
  static_assert(traits::is_shared, "folly::SharedMutex is a shared lock");
  static_assert(traits::is_upgrade, "folly::SharedMutex is an upgradable lock");

  SharedMutex mutex;
  traits::lock(mutex);
  traits::unlock(mutex);

  traits::lock_shared(mutex);
  traits::lock_shared(mutex);
  traits::unlock_shared(mutex);
  traits::unlock_shared(mutex);

  traits::lock_upgrade(mutex);
  traits::unlock_upgrade(mutex);

  // test upgrade and downgrades
  traits::lock_upgrade(mutex);
  traits::unlock_upgrade_and_lock(mutex);
  bool gotLock = traits::try_lock_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an exclusive "
                           "lock after upgrading to an exclusive lock";
  gotLock = traits::try_lock_upgrade_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an upgrade "
                           "lock after upgrading to an exclusive lock";
  gotLock = traits::try_lock_shared_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire a shared "
                           "lock after upgrading to an exclusive lock";
  traits::unlock(mutex);

  traits::lock_upgrade(mutex);
  traits::unlock_upgrade_and_lock_shared(mutex);
  gotLock = traits::try_lock_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an exclusive "
                           "mutex after downgrading from an upgrade to a "
                           "shared lock";
  traits::unlock_shared(mutex);

  traits::lock(mutex);
  gotLock = traits::try_lock_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an exclusive "
                           "lock after acquiring an exclusive lock";
  gotLock = traits::try_lock_upgrade_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an upgrade "
                           "lock after acquiring an exclusive lock";
  gotLock = traits::try_lock_shared_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire a shared "
                           "lock after acquiring an exclusive lock";
  traits::unlock_and_lock_upgrade(mutex);
  gotLock = traits::try_lock_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an exclusive "
                           "lock after downgrading to an upgrade lock";
  traits::unlock_upgrade(mutex);

  traits::lock(mutex);
  traits::unlock_and_lock_shared(mutex);
  gotLock = traits::try_lock_for(mutex, one_ms);
  EXPECT_FALSE(gotLock) << "Should not have been able to acquire an exclusive "
                           "lock after downgrading to a shared lock";
  traits::unlock_shared(mutex);
}

TEST(LockTraits, SpinLock) {
  using traits = LockTraits<SpinLock>;
  static_assert(!traits::is_timed, "folly::SpinLock is not a timed lock");
  static_assert(!traits::is_shared, "folly::SpinLock is not a shared lock");
  static_assert(
      !traits::is_upgrade, "folly::SpinLock is not an upgradable lock");

  SpinLock mutex;
  traits::lock(mutex);
  traits::unlock(mutex);
}

TEST(LockTraits, RWSpinLock) {
  using traits = LockTraits<RWSpinLock>;
  static_assert(!traits::is_timed, "folly::RWSpinLock is not a timed lock");
  static_assert(traits::is_shared, "folly::RWSpinLock is a shared lock");
  static_assert(traits::is_upgrade, "folly::RWSpinLock is an upgradable lock");

  RWSpinLock mutex;
  traits::lock(mutex);
  traits::unlock(mutex);

  traits::lock_shared(mutex);
  traits::lock_shared(mutex);
  traits::unlock_shared(mutex);
  traits::unlock_shared(mutex);
}

TEST(LockTraits, boost_mutex) {
  using traits = LockTraits<boost::mutex>;
  static_assert(!traits::is_timed, "boost::mutex is not a timed lock");
  static_assert(!traits::is_shared, "boost::mutex is not a shared lock");
  static_assert(!traits::is_upgrade, "boost::mutex is not an upgradable lock");

  boost::mutex mutex;
  traits::lock(mutex);
  traits::unlock(mutex);
}

TEST(LockTraits, boost_recursive_mutex) {
  using traits = LockTraits<boost::recursive_mutex>;
  static_assert(
      !traits::is_timed, "boost::recursive_mutex is not a timed lock");
  static_assert(
      !traits::is_shared, "boost::recursive_mutex is not a shared lock");
  static_assert(
      !traits::is_upgrade, "boost::recursive_mutex is not an upgradable lock");

  boost::recursive_mutex mutex;
  traits::lock(mutex);
  traits::lock(mutex);
  traits::unlock(mutex);
  traits::unlock(mutex);
}

#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
TEST(LockTraits, timed_mutex) {
  using traits = LockTraits<std::timed_mutex>;
  static_assert(traits::is_timed, "std::timed_mutex is a timed lock");
  static_assert(!traits::is_shared, "std::timed_mutex is not a shared lock");
  static_assert(
      !traits::is_upgrade, "std::timed_mutex is not an upgradable lock");

  std::timed_mutex mutex;
  traits::lock(mutex);
  bool gotLock = traits::try_lock_for(mutex, std::chrono::milliseconds(1));
  EXPECT_FALSE(gotLock) << "should not have been able to acquire the "
                        << "timed_mutex a second time";
  traits::unlock(mutex);
}

TEST(LockTraits, recursive_timed_mutex) {
  using traits = LockTraits<std::recursive_timed_mutex>;
  static_assert(traits::is_timed, "std::recursive_timed_mutex is a timed lock");
  static_assert(
      !traits::is_shared, "std::recursive_timed_mutex is not a shared lock");
  static_assert(
      !traits::is_upgrade,
      "std::recursive_timed_mutex is not an upgradable lock");

  std::recursive_timed_mutex mutex;
  traits::lock(mutex);
  auto gotLock = traits::try_lock_for(mutex, std::chrono::milliseconds(10));
  EXPECT_TRUE(gotLock) << "should have been able to acquire the "
                       << "recursive_timed_mutex a second time";
  traits::unlock(mutex);
  traits::unlock(mutex);
}

TEST(LockTraits, boost_shared_mutex) {
  using traits = LockTraits<boost::shared_mutex>;
  static_assert(traits::is_timed, "boost::shared_mutex is a timed lock");
  static_assert(traits::is_shared, "boost::shared_mutex is a shared lock");
  static_assert(
      traits::is_upgrade, "boost::shared_mutex is an upgradable lock");

  boost::shared_mutex mutex;
  traits::lock(mutex);
  auto gotLock = traits::try_lock_for(mutex, std::chrono::milliseconds(1));
  EXPECT_FALSE(gotLock) << "should not have been able to acquire the "
                        << "shared_mutex a second time";
  gotLock = traits::try_lock_shared_for(mutex, std::chrono::milliseconds(1));
  EXPECT_FALSE(gotLock) << "should not have been able to acquire the "
                        << "shared_mutex a second time";
  traits::unlock(mutex);

  traits::lock_shared(mutex);
  gotLock = traits::try_lock_for(mutex, std::chrono::milliseconds(1));
  EXPECT_FALSE(gotLock) << "should not have been able to acquire the "
                        << "shared_mutex a second time";
  gotLock = traits::try_lock_shared_for(mutex, std::chrono::milliseconds(10));
  EXPECT_TRUE(gotLock) << "should have been able to acquire the "
                       << "shared_mutex a second time in shared mode";
  traits::unlock_shared(mutex);
  traits::unlock_shared(mutex);
}
#endif // FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES

/**
 * Chain the asserts from the previous test to the next lock, unlock or
 * upgrade method calls.  Each making sure that the previous was correct.
 */
TEST(LockTraits, LockPolicy) {
  using Mutex = FakeAllPowerfulAssertingMutex;
  Mutex mutex;

  // test the lock and unlock functions
  LockPolicyUpgrade::lock(mutex);
  mutex.unlock_upgrade();
  mutex.lock_upgrade();
  LockPolicyUpgrade::unlock(mutex);

  mutex.lock_upgrade();
  LockPolicyFromUpgradeToExclusive::lock(mutex);
  mutex.unlock();
  mutex.lock();
  LockPolicyFromUpgradeToExclusive::unlock(mutex);

  mutex.lock();
  LockPolicyFromExclusiveToUpgrade::lock(mutex);
  mutex.unlock_upgrade();
  mutex.lock_upgrade();
  LockPolicyFromExclusiveToUpgrade::unlock(mutex);

  mutex.lock_upgrade();
  LockPolicyFromUpgradeToShared::lock(mutex);
  mutex.unlock_shared();
  mutex.lock_shared();
  LockPolicyFromUpgradeToShared::unlock(mutex);

  mutex.lock();
  LockPolicyFromExclusiveToShared::lock(mutex);
  mutex.unlock_shared();
  mutex.lock_shared();
  LockPolicyFromExclusiveToShared::unlock(mutex);

  EXPECT_EQ(mutex.lock_state, Mutex::CurrentLockState::UNLOCKED);
}

/**
 * Similar to the test above but tests the timed version of the updates
 */
TEST(LockTraits, LockPolicyTimed) {
  using Mutex = FakeAllPowerfulAssertingMutex;
  Mutex mutex;

  bool gotLock = LockPolicyUpgrade::try_lock_for(mutex, one_ms);
  EXPECT_TRUE(gotLock) << "Should have been able to acquire the fake mutex";
  LockPolicyUpgrade::unlock(mutex);

  mutex.lock_upgrade();
  gotLock = LockPolicyFromUpgradeToExclusive::try_lock_for(mutex, one_ms);
  EXPECT_TRUE(gotLock)
      << "Should have been able to upgrade from upgrade to unique";
  mutex.unlock();

  mutex.lock();
  gotLock = LockPolicyFromExclusiveToUpgrade::try_lock_for(mutex, one_ms);
  EXPECT_TRUE(gotLock) << "Should have been able to downgrade from exclusive "
                          "to upgrade";
  mutex.unlock_upgrade();

  mutex.lock_upgrade();
  gotLock = LockPolicyFromUpgradeToShared::try_lock_for(mutex, one_ms);
  EXPECT_TRUE(gotLock) << "Should have been able to downgrade from upgrade to "
                          "shared";
  mutex.unlock_shared();

  mutex.lock();
  gotLock = LockPolicyFromExclusiveToShared::try_lock_for(mutex, one_ms);
  EXPECT_TRUE(gotLock) << "Should have been able to downgrade from exclusive "
                          "to shared";
  mutex.unlock_shared();
}

/**
 * Test compatibility of the different lock policies
 *
 * This should be correct because the compatibilities here are used to
 * determine whether or not the different LockedPtr instances can be moved
 * from each other
 */
TEST(LockTraits, LockPolicyCompatibilities) {
  EXPECT_TRUE((std::is_same<
               LockPolicyExclusive::UnlockPolicy,
               LockPolicyTryExclusive::UnlockPolicy>::value));
  EXPECT_TRUE((std::is_same<
               LockPolicyExclusive::UnlockPolicy,
               LockPolicyFromUpgradeToExclusive::UnlockPolicy>::value));

  EXPECT_TRUE((std::is_same<
               LockPolicyShared::UnlockPolicy,
               LockPolicyTryShared::UnlockPolicy>::value));
  EXPECT_TRUE((std::is_same<
               LockPolicyShared::UnlockPolicy,
               LockPolicyFromUpgradeToShared::UnlockPolicy>::value));
  EXPECT_TRUE((std::is_same<
               LockPolicyShared::UnlockPolicy,
               LockPolicyFromExclusiveToShared::UnlockPolicy>::value));

  EXPECT_TRUE((std::is_same<
               LockPolicyUpgrade::UnlockPolicy,
               LockPolicyTryUpgrade::UnlockPolicy>::value));
  EXPECT_TRUE((std::is_same<
               LockPolicyUpgrade::UnlockPolicy,
               LockPolicyFromExclusiveToUpgrade::UnlockPolicy>::value));
}
