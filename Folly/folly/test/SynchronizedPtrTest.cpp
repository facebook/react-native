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
#include <folly/SynchronizedPtr.h>

#include <folly/Optional.h>
#include <folly/Replaceable.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/RWSpinLock.h>

template <typename SPtr>
void basics(SPtr& sptr) {
  EXPECT_TRUE((std::is_same<int const&, decltype(*sptr.rlock())>::value));
  auto initialValue = *sptr.rlock();
  bool rlockedTypeOK{false};
  sptr.withRLock([&](auto&& value) {
    rlockedTypeOK = std::is_same<int const&, decltype(value)>::value;
  });
  EXPECT_TRUE(rlockedTypeOK);
  EXPECT_TRUE((std::is_same<int&, decltype(*sptr.wlock())>::value));
  bool wlockedTypeOK{false};
  sptr.withWLock([&](auto&& value) {
    wlockedTypeOK = std::is_same<int&, decltype(value)>::value;
    ++value;
  });
  EXPECT_TRUE(wlockedTypeOK);
  EXPECT_EQ(initialValue + 1, *sptr.rlock());
}

TEST(SynchronizedPtrTest, Shared) {
  folly::SynchronizedPtr<std::shared_ptr<int>> pInt{std::make_shared<int>(0)};
  basics(pInt);
}

TEST(SynchronizedPtrTest, UniqueBasic) {
  folly::SynchronizedPtr<std::unique_ptr<int>> pInt{std::make_unique<int>(0)};
  basics(pInt);
}

TEST(SynchronizedPtrTest, UniqueDeleter) {
  bool calledDeleter = false;
  auto x = [&](int* ptr) {
    delete ptr;
    calledDeleter = true;
  };
  {
    folly::SynchronizedPtr<std::unique_ptr<int, decltype(x)>> pInt{
        std::unique_ptr<int, decltype(x)>(new int(0), x)};
    basics(pInt);
    EXPECT_TRUE((std::is_same<
                 std::unique_ptr<int, decltype(x)>&,
                 decltype(*pInt.wlockPointer())>::value));
    pInt.wlockPointer()->reset(new int(5));
    EXPECT_TRUE(calledDeleter);
    calledDeleter = false;
  }
  EXPECT_TRUE(calledDeleter);
}

TEST(SynchronizedPtrTest, Replaceable) {
  folly::SynchronizedPtr<folly::Replaceable<int>> pInt{0};
  folly::SynchronizedPtr<folly::Replaceable<int const>> pcInt{2};
  basics(pInt);
  EXPECT_TRUE(
      (std::is_same<folly::Replaceable<int>&, decltype(*pInt.wlockPointer())>::
           value));
  EXPECT_TRUE((std::is_same<
               folly::Replaceable<int const>&,
               decltype(*pcInt.wlockPointer())>::value));
  pcInt.withWLockPointer([](auto&& ptr) {
    EXPECT_TRUE(
        (std::is_same<folly::Replaceable<int const>&, decltype(ptr)>::value));
    ptr.emplace(4);
  });
  EXPECT_EQ(4, *pcInt.rlock());
}

TEST(SynchronizedPtrTest, Optional) {
  folly::SynchronizedPtr<folly::Optional<int>, folly::RWSpinLock> pInt{0};
  basics(pInt);
  EXPECT_TRUE(
      (std::is_same<folly::Optional<int>&, decltype(*pInt.wlockPointer())>::
           value));
  EXPECT_TRUE(static_cast<bool>(pInt.rlock()));
  pInt.withWLockPointer([](auto&& ptr) {
    EXPECT_TRUE((std::is_same<folly::Optional<int>&, decltype(ptr)>::value));
    ptr.clear();
  });
  EXPECT_FALSE(static_cast<bool>(pInt.rlock()));
}

TEST(SynchronizedPtrTest, Virtual) {
  struct A {
    virtual void poke(bool&) const {}
    virtual ~A() = default;
  };
  struct B : A {
    void poke(bool& b) const override {
      b = true;
    }
  };
  folly::SynchronizedPtr<A*> pA{new B()};
  bool itWorks = false;
  pA.rlock()->poke(itWorks);
  EXPECT_TRUE(itWorks);
  itWorks = false;
  pA.wlock()->poke(itWorks);
  EXPECT_TRUE(itWorks);
  pA.withWLockPointer([](auto&& ptr) {
    EXPECT_TRUE((std::is_same<A*&, decltype(ptr)>::value));
    delete ptr;
    ptr = new B();
  });
  {
    auto lockedPtr = pA.wlockPointer();
    EXPECT_TRUE((std::is_same<A*&, decltype(*lockedPtr)>::value));
    delete *lockedPtr;
    *lockedPtr = new B();
  }
  itWorks = false;
  pA.wlock()->poke(itWorks);
  EXPECT_TRUE(itWorks);
  delete *pA.wlockPointer();
}
