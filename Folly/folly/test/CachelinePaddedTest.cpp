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

#include <folly/CachelinePadded.h>

#include <type_traits>

#include <folly/lang/Align.h>
#include <folly/portability/GTest.h>

using folly::CachelinePadded;

static_assert(
    std::is_standard_layout<CachelinePadded<int>>::value,
    "CachelinePadded<T> must be standard-layout if T is.");

static constexpr int kCachelineSize =
    folly::hardware_destructive_interference_size;

template <size_t dataSize, size_t alignment = alignof(void*)>
struct alignas(alignment) SizedData {
  SizedData() {
    size_t i = 0;
    for (auto& datum : data) {
      datum = i++;
    }
  }

  void doModifications() {
    size_t i = 0;
    for (auto& datum : data) {
      EXPECT_EQ(static_cast<unsigned char>(i), datum);
      ++i;
      ++datum;
    }
  }

  ~SizedData() {
    size_t i = 1;
    for (auto& datum : data) {
      EXPECT_EQ(static_cast<unsigned char>(i), datum);
      ++i;
    }
  }

  unsigned char data[dataSize];
};

template <typename T, size_t N = 1>
using SizedDataMimic = SizedData<N * sizeof(T), alignof(T)>;

template <typename T>
struct CachelinePaddedTests : ::testing::Test {};

using CachelinePaddedTypes = ::testing::Types<
    SizedData<kCachelineSize>,
    SizedData<2 * kCachelineSize>,
    SizedData<kCachelineSize / 2>,
    SizedData<kCachelineSize + kCachelineSize / 2>,
    // Mimic single basic types:
    SizedDataMimic<folly::max_align_t>,
    SizedDataMimic<void*>,
    SizedDataMimic<long double>,
    SizedDataMimic<double>,
    SizedDataMimic<float>,
    SizedDataMimic<long long>,
    SizedDataMimic<long>,
    SizedDataMimic<int>,
    SizedDataMimic<short>,
    SizedDataMimic<char>,
    // Mimic small arrays of basic types:
    SizedDataMimic<folly::max_align_t, 3>,
    SizedDataMimic<void*, 3>,
    SizedDataMimic<long double, 3>,
    SizedDataMimic<double, 3>,
    SizedDataMimic<float, 3>,
    SizedDataMimic<long long, 3>,
    SizedDataMimic<long, 3>,
    SizedDataMimic<int, 3>,
    SizedDataMimic<short, 3>,
    SizedDataMimic<char, 3>,
    // Mimic large arrays of basic types:
    SizedDataMimic<folly::max_align_t, kCachelineSize + 3>,
    SizedDataMimic<void*, kCachelineSize + 3>,
    SizedDataMimic<long double, kCachelineSize + 3>,
    SizedDataMimic<double, kCachelineSize + 3>,
    SizedDataMimic<float, kCachelineSize + 3>,
    SizedDataMimic<long long, kCachelineSize + 3>,
    SizedDataMimic<long, kCachelineSize + 3>,
    SizedDataMimic<int, kCachelineSize + 3>,
    SizedDataMimic<short, kCachelineSize + 3>,
    SizedDataMimic<char, kCachelineSize + 3>>;
TYPED_TEST_CASE(CachelinePaddedTests, CachelinePaddedTypes);

TYPED_TEST(CachelinePaddedTests, alignment) {
  EXPECT_EQ(alignof(TypeParam), alignof(CachelinePadded<TypeParam>));
}

TYPED_TEST(CachelinePaddedTests, integrity) {
  CachelinePadded<TypeParam> item;
  item.get()->doModifications();
}

TYPED_TEST(CachelinePaddedTests, size) {
  EXPECT_GT(
      sizeof(TypeParam) + 2 * kCachelineSize,
      sizeof(CachelinePadded<TypeParam>));
  size_t const rawSize = sizeof(TypeParam);
  size_t const rawAlign = alignof(TypeParam);
  size_t const expectedPadding = kCachelineSize - (rawAlign % kCachelineSize);
  size_t const expectedPaddedSize = rawSize + 2 * expectedPadding;
  EXPECT_EQ(expectedPaddedSize, sizeof(CachelinePadded<TypeParam>));
}

TEST(CachelinePadded, PtrOperator) {
  CachelinePadded<int> padded;
  EXPECT_TRUE(padded.get() == padded.operator->());
  EXPECT_TRUE(&*padded == padded.get());
  const auto constPadded = CachelinePadded<int>{};
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

  const auto constPadded = CachelinePadded<OverloadedOnConst>{};
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
