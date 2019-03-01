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

#include <folly/CachelinePadded.h>

#include <type_traits>

#include <folly/portability/GTest.h>

using folly::CachelinePadded;

static_assert(
    std::is_standard_layout<CachelinePadded<int>>::value,
    "CachelinePadded<T> must be standard-layout if T is.");

const int kCachelineSize = folly::detail::CacheLocality::kFalseSharingRange;

template <int dataSize>
struct SizedData {
  SizedData() {
    for (unsigned i = 0; i < dataSize; ++i) {
      data[i] = i;
    }
  }

  void doModifications() {
    for (unsigned i = 0; i < dataSize; ++i) {
      EXPECT_EQ(static_cast<unsigned char>(i), data[i]);
      ++data[i];
    }
  }

  ~SizedData() {
    for (unsigned i = 0; i < dataSize; ++i) {
      EXPECT_EQ(static_cast<unsigned char>(i + 1), data[i]);
    }
  }

  unsigned char data[dataSize];
};

using ExactlyCachelineSized = SizedData<kCachelineSize>;
using DoubleCachelineSized = SizedData<2 * kCachelineSize>;
using BelowCachelineSized = SizedData<kCachelineSize / 2>;
using AboveCachelineSized = SizedData<kCachelineSize + kCachelineSize / 2>;

TEST(CachelinePadded, Exact) {
  EXPECT_EQ(kCachelineSize, sizeof(CachelinePadded<ExactlyCachelineSized>));
  CachelinePadded<ExactlyCachelineSized> item;
  item.get()->doModifications();
  EXPECT_TRUE(
      reinterpret_cast<CachelinePadded<ExactlyCachelineSized>*>(item.get()) ==
      &item);
}

TEST(CachelinePadded, Double) {
  EXPECT_EQ(2 * kCachelineSize, sizeof(CachelinePadded<DoubleCachelineSized>));
  CachelinePadded<DoubleCachelineSized> item;
  item.get()->doModifications();
  EXPECT_TRUE(
      reinterpret_cast<CachelinePadded<DoubleCachelineSized>*>(item.get()) ==
      &item);
}

TEST(CachelinePadded, Below) {
  EXPECT_EQ(kCachelineSize, sizeof(CachelinePadded<BelowCachelineSized>));
  CachelinePadded<BelowCachelineSized> item;
  item.get()->doModifications();
  EXPECT_TRUE(
      reinterpret_cast<CachelinePadded<BelowCachelineSized>*>(item.get()) ==
      &item);
}

TEST(CachelinePadded, Above) {
  EXPECT_EQ(2 * kCachelineSize, sizeof(CachelinePadded<AboveCachelineSized>));
  CachelinePadded<AboveCachelineSized> item;
  item.get()->doModifications();
  EXPECT_TRUE(
      reinterpret_cast<CachelinePadded<AboveCachelineSized>*>(item.get()) ==
      &item);
}

TEST(CachelinePadded, CanBeCastedBack) {
  CachelinePadded<int> padded;
  CachelinePadded<int>* ptr =
      reinterpret_cast<CachelinePadded<int>*>(padded.get());
  EXPECT_EQ(&padded, ptr);
}

TEST(CachelinePadded, PtrOperator) {
  CachelinePadded<int> padded;
  EXPECT_TRUE(padded.get() == padded.operator->());
  EXPECT_TRUE(&*padded == padded.get());
  const CachelinePadded<int> constPadded;
  EXPECT_TRUE(constPadded.get() == constPadded.operator->());
  EXPECT_TRUE(constPadded.get() == &*constPadded.get());
}

TEST(CachelinePadded, PropagatesConstness) {
  struct OverloadedOnConst {
    void assign(int* dst) {
      *dst = 31415;
    }
    void assign(int* dst) const {
      *dst = 271828;
    }
  };

  CachelinePadded<OverloadedOnConst> padded;

  int i = 0;
  padded->assign(&i);
  EXPECT_EQ(31415, i);

  const CachelinePadded<OverloadedOnConst> constPadded;
  constPadded->assign(&i);
  EXPECT_EQ(271828, i);
}

TEST(CachelinePadded, ConstructsAndDestructs) {
  enum LifetimeStatus {
    kNone,
    kConstructed,
    kDestroyed,
  };
  struct WriteOnLifetimeOp {
    explicit WriteOnLifetimeOp(LifetimeStatus* dst) : dst_(dst) {
      *dst = kConstructed;
    }
    ~WriteOnLifetimeOp() {
      *dst_ = kDestroyed;
    }
    LifetimeStatus* dst_;
  };
  LifetimeStatus status = kNone;
  CachelinePadded<WriteOnLifetimeOp>* ptr =
      new CachelinePadded<WriteOnLifetimeOp>(&status);
  EXPECT_EQ(kConstructed, status);
  delete ptr;
  EXPECT_EQ(kDestroyed, status);
}

TEST(CachelinePadded, ConstructsAndDestructsArrays) {
  static thread_local int numConstructions;
  static thread_local int numDestructions;
  numConstructions = 0;
  numDestructions = 0;
  struct LifetimeCountingClass {
    LifetimeCountingClass() {
      ++numConstructions;
    }
    ~LifetimeCountingClass() {
      ++numDestructions;
    }
  };
  const static int kNumItems = 123;
  CachelinePadded<LifetimeCountingClass>* ptr =
      new CachelinePadded<LifetimeCountingClass>[kNumItems];
  EXPECT_EQ(kNumItems, numConstructions);
  delete[] ptr;
  EXPECT_EQ(kNumItems, numDestructions);
}

TEST(CachelinePadded, ForwardsCorrectly) {
  struct RvalueOverloadedConstructor {
    RvalueOverloadedConstructor(int* dst, int& /* ignored */) {
      *dst = 0;
    }
    RvalueOverloadedConstructor(int* dst, int&& /* ignored */) {
      *dst = 1;
    }
  };
  int shouldBeZero = 12345;
  int shouldBeOne = 67890;
  {
    int ignored = 42;
    CachelinePadded<RvalueOverloadedConstructor> padded1(
        &shouldBeZero, ignored);
    CachelinePadded<RvalueOverloadedConstructor> padded2(
        &shouldBeOne, static_cast<int&&>(ignored));
  }
  EXPECT_EQ(0, shouldBeZero);
  EXPECT_EQ(1, shouldBeOne);
}
