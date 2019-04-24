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

#include <folly/container/F14Set.h>

#include <unordered_map>

#include <folly/Conv.h>
#include <folly/FBString.h>
#include <folly/container/test/F14TestUtil.h>
#include <folly/portability/GTest.h>

template <template <typename, typename, typename, typename> class TSet>
void testCustomSwap() {
  using std::swap;

  TSet<
      int,
      folly::f14::DefaultHasher<int>,
      folly::f14::DefaultKeyEqual<int>,
      folly::f14::SwapTrackingAlloc<int>>
      m0, m1;
  folly::f14::resetTracking();
  swap(m0, m1);

  EXPECT_EQ(
      0, folly::f14::Tracked<0>::counts.dist(folly::f14::Counts{0, 0, 0, 0}));
}

TEST(F14Set, customSwap) {
  testCustomSwap<folly::F14ValueSet>();
  testCustomSwap<folly::F14NodeSet>();
  testCustomSwap<folly::F14VectorSet>();
  testCustomSwap<folly::F14FastSet>();
}

namespace {
template <
    template <typename, typename, typename, typename> class TSet,
    typename K>
void runAllocatedMemorySizeTest() {
  using namespace folly::f14;
  using namespace folly::f14::detail;
  using A = SwapTrackingAlloc<K>;

  resetTracking();
  {
    TSet<K, DefaultHasher<K>, DefaultKeyEqual<K>, A> s;

    // if F14 intrinsics are not available then we fall back to using
    // std::unordered_set underneath, but in that case the allocation
    // info is only best effort
    bool preciseAllocInfo = getF14IntrinsicsMode() != F14IntrinsicsMode::None;

    if (preciseAllocInfo) {
      EXPECT_EQ(testAllocatedMemorySize, 0);
      EXPECT_EQ(s.getAllocatedMemorySize(), 0);
    }
    auto emptySetAllocatedMemorySize = testAllocatedMemorySize;
    auto emptySetAllocatedBlockCount = testAllocatedBlockCount;

    for (size_t i = 0; i < 1000; ++i) {
      s.insert(folly::to<K>(i));
      s.erase(folly::to<K>(i / 10 + 2));
      if (preciseAllocInfo) {
        EXPECT_EQ(testAllocatedMemorySize, s.getAllocatedMemorySize());
      }
      EXPECT_GE(s.getAllocatedMemorySize(), sizeof(K) * s.size());
      std::size_t size = 0;
      std::size_t count = 0;
      s.visitAllocationClasses([&](std::size_t, std::size_t) mutable {});
      s.visitAllocationClasses([&](std::size_t bytes, std::size_t n) {
        size += bytes * n;
        count += n;
      });
      if (preciseAllocInfo) {
        EXPECT_EQ(testAllocatedMemorySize, size);
        EXPECT_EQ(testAllocatedBlockCount, count);
      }
    }

    s = decltype(s){};
    EXPECT_EQ(testAllocatedMemorySize, emptySetAllocatedMemorySize);
    EXPECT_EQ(testAllocatedBlockCount, emptySetAllocatedBlockCount);

    s.reserve(5);
    EXPECT_GT(testAllocatedMemorySize, 0);
    s = {};
    EXPECT_GT(testAllocatedMemorySize, 0);
  }
  EXPECT_EQ(testAllocatedMemorySize, 0);
  EXPECT_EQ(testAllocatedBlockCount, 0);
}

template <typename K>
void runAllocatedMemorySizeTests() {
  runAllocatedMemorySizeTest<folly::F14ValueSet, K>();
  runAllocatedMemorySizeTest<folly::F14NodeSet, K>();
  runAllocatedMemorySizeTest<folly::F14VectorSet, K>();
  runAllocatedMemorySizeTest<folly::F14FastSet, K>();
}
} // namespace

TEST(F14Set, getAllocatedMemorySize) {
  runAllocatedMemorySizeTests<bool>();
  runAllocatedMemorySizeTests<int>();
  runAllocatedMemorySizeTests<long>();
  runAllocatedMemorySizeTests<double>();
  runAllocatedMemorySizeTests<std::string>();
  runAllocatedMemorySizeTests<folly::fbstring>();
}

template <typename S>
void runVisitContiguousRangesTest(int n) {
  S set;

  for (int i = 0; i < n; ++i) {
    set.insert(i);
    set.erase(i / 2);
  }

  std::unordered_map<uintptr_t, bool> visited;
  for (auto& entry : set) {
    visited[reinterpret_cast<uintptr_t>(&entry)] = false;
  }

  set.visitContiguousRanges([&](auto b, auto e) {
    for (auto i = b; i != e; ++i) {
      auto iter = visited.find(reinterpret_cast<uintptr_t>(i));
      ASSERT_TRUE(iter != visited.end());
      EXPECT_FALSE(iter->second);
      iter->second = true;
    }
  });

  // ensure no entries were skipped
  for (auto& e : visited) {
    EXPECT_TRUE(e.second);
  }
}

template <typename S>
void runVisitContiguousRangesTest() {
  runVisitContiguousRangesTest<S>(0); // empty
  runVisitContiguousRangesTest<S>(5); // single chunk
  runVisitContiguousRangesTest<S>(1000); // many chunks
}

TEST(F14ValueSet, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14ValueSet<int>>();
}

TEST(F14NodeSet, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14NodeSet<int>>();
}

TEST(F14VectorSet, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14VectorSet<int>>();
}

TEST(F14FastSet, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14FastSet<int>>();
}

///////////////////////////////////
#if FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
///////////////////////////////////

#include <chrono>
#include <random>
#include <string>
#include <unordered_set>

#include <folly/Range.h>

using namespace folly;
using namespace folly::f14;
using namespace folly::string_piece_literals;

namespace {
std::string s(char const* p) {
  return p;
}
} // namespace

template <typename T>
void runSimple() {
  T h;

  EXPECT_EQ(h.size(), 0);

  h.insert(s("abc"));
  EXPECT_TRUE(h.find(s("def")) == h.end());
  EXPECT_FALSE(h.find(s("abc")) == h.end());
  h.insert(s("ghi"));
  EXPECT_EQ(h.size(), 2);
  h.erase(h.find(s("abc")));
  EXPECT_EQ(h.size(), 1);

  T h2(std::move(h));
  EXPECT_EQ(h.size(), 0);
  EXPECT_TRUE(h.begin() == h.end());
  EXPECT_EQ(h2.size(), 1);

  EXPECT_TRUE(h2.find(s("abc")) == h2.end());
  EXPECT_EQ(*h2.begin(), s("ghi"));
  {
    auto i = h2.begin();
    EXPECT_FALSE(i == h2.end());
    ++i;
    EXPECT_TRUE(i == h2.end());
  }

  T h3;
  h3.insert(s("xxx"));
  h3.insert(s("yyy"));
  h3 = std::move(h2);
  EXPECT_EQ(h2.size(), 0);
  EXPECT_EQ(h3.size(), 1);
  EXPECT_TRUE(h3.find(s("xxx")) == h3.end());

  for (uint64_t i = 0; i < 1000; ++i) {
    h.insert(std::move(to<std::string>(i * i * i)));
    EXPECT_EQ(h.size(), i + 1);
  }
  {
    using std::swap;
    swap(h, h2);
  }
  for (uint64_t i = 0; i < 1000; ++i) {
    EXPECT_TRUE(h2.find(to<std::string>(i * i * i)) != h2.end());
    EXPECT_EQ(*h2.find(to<std::string>(i * i * i)), to<std::string>(i * i * i));
    EXPECT_TRUE(h2.find(to<std::string>(i * i * i + 2)) == h2.end());
  }

  T h4{h2};
  EXPECT_EQ(h2.size(), 1000);
  EXPECT_EQ(h4.size(), 1000);

  T h5{std::move(h2)};
  T h6;
  h6 = h4;
  T h7 = h4;

  T h8({s("abc"), s("def")});
  T h9({s("abd"), s("def")});
  EXPECT_EQ(h8.size(), 2);
  EXPECT_EQ(h8.count(s("abc")), 1);
  EXPECT_EQ(h8.count(s("xyz")), 0);

  EXPECT_TRUE(h7 != h8);
  EXPECT_TRUE(h8 != h9);

  h8 = std::move(h7);
  // h2 and h7 are moved from, h4, h5, h6, and h8 should be identical

  EXPECT_TRUE(h4 == h8);

  EXPECT_TRUE(h2.empty());
  EXPECT_TRUE(h7.empty());
  for (uint64_t i = 0; i < 1000; ++i) {
    auto k = to<std::string>(i * i * i);
    EXPECT_EQ(h4.count(k), 1);
    EXPECT_EQ(h5.count(k), 1);
    EXPECT_EQ(h6.count(k), 1);
    EXPECT_EQ(h8.count(k), 1);
  }

  h8.clear();
  h8.emplace(s("abc"));
  EXPECT_GT(h8.bucket_count(), 1);
  h8 = {};
  EXPECT_GT(h8.bucket_count(), 1);
  h9 = {s("abc"), s("def")};
  EXPECT_TRUE(h8.empty());
  EXPECT_EQ(h9.size(), 2);

  auto expectH8 = [&](T& ref) { EXPECT_EQ(&ref, &h8); };
  expectH8((h8 = h2));
  expectH8((h8 = std::move(h2)));
  expectH8((h8 = {}));

  F14TableStats::compute(h);
  F14TableStats::compute(h2);
  F14TableStats::compute(h3);
  F14TableStats::compute(h4);
  F14TableStats::compute(h5);
  F14TableStats::compute(h6);
  F14TableStats::compute(h7);
  F14TableStats::compute(h8);
}

template <typename T>
void runRehash() {
  unsigned n = 10000;
  T h;
  for (unsigned i = 0; i < n; ++i) {
    h.insert(to<std::string>(i));
  }
  EXPECT_EQ(h.size(), n);
  F14TableStats::compute(h);
}

// T should be a set of uint64_t
template <typename T>
void runRandom() {
  using R = std::unordered_set<uint64_t>;

  std::mt19937_64 gen(0);
  std::uniform_int_distribution<> pctDist(0, 100);
  std::uniform_int_distribution<uint64_t> bitsBitsDist(1, 6);
  T t0;
  T t1;
  R r0;
  R r1;

  for (std::size_t reps = 0; reps < 100000; ++reps) {
    // discardBits will be from 0 to 62
    auto discardBits = (uint64_t{1} << bitsBitsDist(gen)) - 2;
    auto k = gen() >> discardBits;
    auto pct = pctDist(gen);

    EXPECT_EQ(t0.size(), r0.size());
    if (pct < 15) {
      // insert
      auto t = t0.insert(k);
      auto r = r0.insert(k);
      EXPECT_EQ(t.second, r.second);
      EXPECT_EQ(*t.first, *r.first);
    } else if (pct < 25) {
      // emplace
      auto t = t0.emplace(k);
      auto r = r0.emplace(k);
      EXPECT_EQ(t.second, r.second);
      EXPECT_EQ(*t.first, *r.first);
    } else if (pct < 30) {
      // bulk insert
      t0.insert(t1.begin(), t1.end());
      r0.insert(r1.begin(), r1.end());
    } else if (pct < 40) {
      // erase by key
      auto t = t0.erase(k);
      auto r = r0.erase(k);
      EXPECT_EQ(t, r);
    } else if (pct < 47) {
      // erase by iterator
      if (t0.size() > 0) {
        auto r = r0.find(k);
        if (r == r0.end()) {
          r = r0.begin();
        }
        k = *r;
        auto t = t0.find(k);
        t = t0.erase(t);
        if (t != t0.end()) {
          EXPECT_NE(*t, k);
        }
        r = r0.erase(r);
        if (r != r0.end()) {
          EXPECT_NE(*r, k);
        }
      }
    } else if (pct < 50) {
      // bulk erase
      if (t0.size() > 0) {
        auto r = r0.find(k);
        if (r == r0.end()) {
          r = r0.begin();
        }
        k = *r;
        auto t = t0.find(k);
        auto firstt = t;
        auto lastt = ++t;
        t = t0.erase(firstt, lastt);
        if (t != t0.end()) {
          EXPECT_NE(*t, k);
        }
        auto firstr = r;
        auto lastr = ++r;
        r = r0.erase(firstr, lastr);
        if (r != r0.end()) {
          EXPECT_NE(*r, k);
        }
      }
    } else if (pct < 58) {
      // find
      auto t = t0.find(k);
      auto r = r0.find(k);
      EXPECT_EQ((t == t0.end()), (r == r0.end()));
      if (t != t0.end() && r != r0.end()) {
        EXPECT_EQ(*t, *r);
      }
      EXPECT_EQ(t0.count(k), r0.count(k));
    } else if (pct < 60) {
      // equal_range
      auto t = t0.equal_range(k);
      auto r = r0.equal_range(k);
      EXPECT_EQ((t.first == t.second), (r.first == r.second));
      if (t.first != t.second && r.first != r.second) {
        EXPECT_EQ(*t.first, *r.first);
        t.first++;
        r.first++;
        EXPECT_TRUE(t.first == t.second);
        EXPECT_TRUE(r.first == r.second);
      }
    } else if (pct < 65) {
      // iterate
      uint64_t t = 0;
      for (auto& e : t0) {
        t += e + 1000;
      }
      uint64_t r = 0;
      for (auto& e : r0) {
        r += e + 1000;
      }
      EXPECT_EQ(t, r);
    } else if (pct < 69) {
      // swap
      using std::swap;
      swap(t0, t1);
      swap(r0, r1);
    } else if (pct < 70) {
      // swap
      t0.swap(t1);
      r0.swap(r1);
    } else if (pct < 72) {
      // default construct
      t0.~T();
      new (&t0) T();
      r0.~R();
      new (&r0) R();
    } else if (pct < 74) {
      // default construct with capacity
      std::size_t capacity = k & 0xffff;
      t0.~T();
      new (&t0) T(capacity);
      r0.~R();
      new (&r0) R(capacity);
    } else if (pct < 80) {
      // bulk iterator construct
      t0.~T();
      new (&t0) T(r1.begin(), r1.end());
      r0.~R();
      new (&r0) R(r1.begin(), r1.end());
    } else if (pct < 82) {
      // initializer list construct
      auto k2 = gen() >> discardBits;
      t0.~T();
      new (&t0) T({k, k, k2});
      r0.~R();
      new (&r0) R({k, k, k2});
    } else if (pct < 88) {
      // copy construct
      t0.~T();
      new (&t0) T(t1);
      r0.~R();
      new (&r0) R(r1);
    } else if (pct < 90) {
      // move construct
      t0.~T();
      new (&t0) T(std::move(t1));
      r0.~R();
      new (&r0) R(std::move(r1));
    } else if (pct < 94) {
      // copy assign
      t0 = t1;
      r0 = r1;
    } else if (pct < 96) {
      // move assign
      t0 = std::move(t1);
      r0 = std::move(r1);
    } else if (pct < 98) {
      // operator==
      EXPECT_EQ((t0 == t1), (r0 == r1));
    } else if (pct < 99) {
      // clear
      t0.computeStats();
      t0.clear();
      r0.clear();
    } else if (pct < 100) {
      // reserve
      auto scale = std::uniform_int_distribution<>(0, 8)(gen);
      auto delta = std::uniform_int_distribution<>(-2, 2)(gen);
      std::ptrdiff_t target = (t0.size() * scale) / 4 + delta;
      if (target >= 0) {
        t0.reserve(static_cast<std::size_t>(target));
        r0.reserve(static_cast<std::size_t>(target));
      }
    }
  }
}

TEST(F14ValueSet, simple) {
  runSimple<F14ValueSet<std::string>>();
}

TEST(F14NodeSet, simple) {
  runSimple<F14NodeSet<std::string>>();
}

TEST(F14VectorSet, simple) {
  runSimple<F14VectorSet<std::string>>();
}

TEST(F14FastSet, simple) {
  // F14FastSet inherits from a conditional typedef. Verify it compiles.
  runRandom<F14FastSet<uint64_t>>();
  runSimple<F14FastSet<std::string>>();
}

TEST(F14Set, ContainerSize) {
  {
    folly::F14ValueSet<int> set;
    set.insert(10);
    EXPECT_EQ(sizeof(set), 4 * sizeof(void*));
    if (alignof(folly::max_align_t) == 16) {
      // chunks will be allocated as 2 max_align_t-s
      EXPECT_EQ(set.getAllocatedMemorySize(), 32);
    } else {
      // chunks will be allocated using aligned_malloc with the true size
      EXPECT_EQ(set.getAllocatedMemorySize(), 24);
    }
  }
  {
    folly::F14NodeSet<int> set;
    set.insert(10);
    EXPECT_EQ(sizeof(set), 4 * sizeof(void*));
    if (alignof(folly::max_align_t) == 16) {
      // chunks will be allocated as 2 max_align_t-s
      EXPECT_EQ(set.getAllocatedMemorySize(), 36);
    } else {
      // chunks will be allocated using aligned_malloc with the true size
      EXPECT_EQ(set.getAllocatedMemorySize(), 20 + 2 * sizeof(void*));
    }
  }
  {
    folly::F14VectorSet<int> set;
    set.insert(10);
    EXPECT_EQ(sizeof(set), 8 + 2 * sizeof(void*));
    EXPECT_EQ(set.getAllocatedMemorySize(), 32);
  }
}

TEST(F14VectorMap, reverse_iterator) {
  using TSet = F14VectorSet<uint64_t>;
  auto populate = [](TSet& h, uint64_t lo, uint64_t hi) {
    for (auto i = lo; i < hi; ++i) {
      h.insert(i);
    }
  };
  auto verify = [](TSet const& h, uint64_t lo, uint64_t hi) {
    auto loIt = h.find(lo);
    EXPECT_NE(h.end(), loIt);
    uint64_t val = lo;
    for (auto rit = h.riter(loIt); rit != h.rend(); ++rit) {
      EXPECT_EQ(val, *rit);
      TSet::const_iterator it = h.iter(rit);
      EXPECT_EQ(val, *it);
      val++;
    }
    EXPECT_EQ(hi, val);
  };

  TSet h;
  size_t prevSize = 0;
  size_t newSize = 1;
  // verify iteration order across rehashes, copies, and moves
  while (newSize < 10'000) {
    populate(h, prevSize, newSize);
    verify(h, 0, newSize);
    verify(h, newSize / 2, newSize);

    TSet h2{h};
    verify(h2, 0, newSize);

    h = std::move(h2);
    verify(h, 0, newSize);
    prevSize = newSize;
    newSize *= 10;
  }
}

TEST(F14ValueSet, rehash) {
  runRehash<F14ValueSet<std::string>>();
}

TEST(F14NodeSet, rehash) {
  runRehash<F14NodeSet<std::string>>();
}

TEST(F14VectorSet, rehash) {
  runRehash<F14VectorSet<std::string>>();
}

TEST(F14ValueSet, random) {
  runRandom<F14ValueSet<uint64_t>>();
}

TEST(F14NodeSet, random) {
  runRandom<F14NodeSet<uint64_t>>();
}

TEST(F14VectorSet, random) {
  runRandom<F14VectorSet<uint64_t>>();
}

TEST(F14ValueSet, grow_stats) {
  F14ValueSet<uint64_t> h;
  for (unsigned i = 1; i <= 3072; ++i) {
    h.insert(i);
  }
  // F14ValueSet just before rehash
  F14TableStats::compute(h);
  h.insert(0);
  // F14ValueSet just after rehash
  F14TableStats::compute(h);
}

TEST(F14ValueSet, steady_state_stats) {
  // 10k keys, 14% probability of insert, 90% chance of erase, so the
  // table should converge to 1400 size without triggering the rehash
  // that would occur at 1536.
  F14ValueSet<uint64_t> h;
  std::mt19937 gen(0);
  std::uniform_int_distribution<> dist(0, 10000);
  for (std::size_t i = 0; i < 100000; ++i) {
    auto key = dist(gen);
    if (dist(gen) < 1400) {
      h.insert(key);
    } else {
      h.erase(key);
    }
    if (((i + 1) % 10000) == 0) {
      auto stats = F14TableStats::compute(h);
      // Verify that average miss probe length is bounded despite continued
      // erase + reuse.  p99 of the average across 10M random steps is 4.69,
      // average is 2.96.
      EXPECT_LT(f14::expectedProbe(stats.missProbeLengthHisto), 10.0);
    }
  }
  // F14ValueSet at steady state
  F14TableStats::compute(h);
}

// S should be a set of Tracked<0>.  F should take a set
// and a key_type const& or key_type&& and cause it to be inserted
template <typename S, typename F>
void runInsertCases(std::string const& /* name */, F const& insertFunc) {
  static_assert(std::is_same<typename S::value_type, Tracked<0>>::value, "");
  {
    typename S::value_type k{0};
    S s;
    resetTracking();
    insertFunc(s, k);
    // fresh key, value_type const& ->
    // copy is expected
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{1, 0, 0, 0}), 0);
  }
  {
    typename S::value_type k{0};
    S s;
    resetTracking();
    insertFunc(s, std::move(k));
    // fresh key, value_type&& ->
    // move is expected
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 1, 0, 0}), 0);
  }
}

struct DoInsert {
  template <typename M, typename P>
  void operator()(M& m, P&& p) const {
    m.insert(std::forward<P>(p));
  }
};

struct DoEmplace1 {
  template <typename M, typename P>
  void operator()(M& m, P&& p) const {
    m.emplace(std::forward<P>(p));
  }
};

template <typename S>
void runInsertAndEmplace() {
  {
    typename S::value_type k1{0};
    typename S::value_type k2{0};
    S s;
    resetTracking();
    EXPECT_TRUE(s.insert(k1).second);
    // copy is expected on successful insert
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{1, 0, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.insert(k2).second);
    // no copies or moves on failing insert
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 0, 0}), 0);
  }
  {
    typename S::value_type k1{0};
    typename S::value_type k2{0};
    S s;
    resetTracking();
    EXPECT_TRUE(s.insert(std::move(k1)).second);
    // move is expected on successful insert
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 1, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.insert(std::move(k2)).second);
    // no copies or moves on failing insert
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 0, 0}), 0);
  }
  {
    typename S::value_type k1{0};
    typename S::value_type k2{0};
    uint64_t k3 = 0;
    S s;
    resetTracking();
    EXPECT_TRUE(s.emplace(k1).second);
    // copy is expected on successful emplace
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{1, 0, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.emplace(k2).second);
    // no copies or moves on failing emplace with value_type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.emplace(k3).second);
    // copy convert expected for failing emplace with wrong type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 1, 0}), 0);

    s.clear();
    resetTracking();
    EXPECT_TRUE(s.emplace(k3).second);
    // copy convert + move expected for successful emplace with wrong type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 1, 1, 0}), 0);
  }
  {
    typename S::value_type k1{0};
    typename S::value_type k2{0};
    uint64_t k3 = 0;
    S s;
    resetTracking();
    EXPECT_TRUE(s.emplace(std::move(k1)).second);
    // move is expected on successful emplace
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 1, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.emplace(std::move(k2)).second);
    // no copies or moves on failing emplace with value_type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 0, 0}), 0);

    resetTracking();
    EXPECT_FALSE(s.emplace(std::move(k3)).second);
    // move convert expected for failing emplace with wrong type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 0, 0, 1}), 0);

    s.clear();
    resetTracking();
    EXPECT_TRUE(s.emplace(std::move(k3)).second);
    // move convert + move expected for successful emplace with wrong type
    EXPECT_EQ(Tracked<0>::counts.dist(Counts{0, 1, 0, 1}), 0);
  }

  // Calling the default pair constructor via emplace is valid, but not
  // very useful in real life.  Verify that it works.
  S s;
  typename S::value_type k;
  EXPECT_EQ(s.count(k), 0);
  s.emplace();
  EXPECT_EQ(s.count(k), 1);
  s.emplace();
  EXPECT_EQ(s.count(k), 1);
}

TEST(F14ValueSet, destructuring) {
  runInsertAndEmplace<F14ValueSet<Tracked<0>>>();
}

TEST(F14NodeSet, destructuring) {
  runInsertAndEmplace<F14NodeSet<Tracked<0>>>();
}

TEST(F14VectorSet, destructuring) {
  runInsertAndEmplace<F14VectorSet<Tracked<0>>>();
}

TEST(F14ValueSet, maxSize) {
  F14ValueSet<int> s;
  EXPECT_EQ(
      s.max_size(), std::numeric_limits<std::size_t>::max() / sizeof(int));
}

TEST(F14NodeSet, maxSize) {
  F14NodeSet<int> s;
  EXPECT_EQ(
      s.max_size(), std::numeric_limits<std::size_t>::max() / sizeof(int));
}

TEST(F14VectorSet, maxSize) {
  F14VectorSet<int> s;
  EXPECT_EQ(
      s.max_size(),
      std::min(
          std::size_t{std::numeric_limits<uint32_t>::max()},
          std::numeric_limits<std::size_t>::max() / sizeof(int)));
}

template <typename S>
void runMoveOnlyTest() {
  S t0;
  t0.emplace(10);
  t0.insert(20);
  S t1{std::move(t0)};
  EXPECT_TRUE(t0.empty());
  S t2;
  EXPECT_TRUE(t2.empty());
  t2 = std::move(t1);
  EXPECT_EQ(t2.size(), 2);
}

TEST(F14ValueSet, moveOnly) {
  runMoveOnlyTest<F14ValueSet<f14::MoveOnlyTestInt>>();
}

TEST(F14NodeSet, moveOnly) {
  runMoveOnlyTest<F14NodeSet<f14::MoveOnlyTestInt>>();
}

TEST(F14VectorSet, moveOnly) {
  runMoveOnlyTest<F14VectorSet<f14::MoveOnlyTestInt>>();
}

TEST(F14FastSet, moveOnly) {
  runMoveOnlyTest<F14FastSet<f14::MoveOnlyTestInt>>();
}

template <typename S>
void runEraseIntoTest() {
  S t0;
  S t1;

  auto insertIntoT0 = [&t0](auto&& value) {
    EXPECT_FALSE(value.destroyed);
    t0.emplace(std::move(value));
  };
  auto insertIntoT0Mut = [&](typename S::value_type&& value) mutable {
    insertIntoT0(std::move(value));
  };

  t0.insert(10);
  t1.insert(20);
  t1.eraseInto(t1.begin(), insertIntoT0);
  EXPECT_TRUE(t1.empty());
  EXPECT_EQ(t0.size(), 2);
  EXPECT_TRUE(t0.find(10) != t0.end());
  EXPECT_TRUE(t0.find(20) != t0.end());

  t1.insert(20);
  t1.insert(30);
  t1.insert(40);
  t1.eraseInto(t1.begin(), t1.end(), insertIntoT0Mut);
  EXPECT_TRUE(t1.empty());
  EXPECT_EQ(t0.size(), 4);
  EXPECT_TRUE(t0.find(30) != t0.end());
  EXPECT_TRUE(t0.find(40) != t0.end());

  t1.insert(50);
  size_t erased = t1.eraseInto(*t1.find(50), insertIntoT0);
  EXPECT_EQ(erased, 1);
  EXPECT_TRUE(t1.empty());
  EXPECT_EQ(t0.size(), 5);
  EXPECT_TRUE(t0.find(50) != t0.end());

  typename S::value_type key{60};
  erased = t1.eraseInto(key, insertIntoT0Mut);
  EXPECT_EQ(erased, 0);
  EXPECT_EQ(t0.size(), 5);
}

TEST(F14ValueSet, eraseInto) {
  runEraseIntoTest<F14ValueSet<f14::MoveOnlyTestInt>>();
}

TEST(F14NodeSet, eraseInto) {
  runEraseIntoTest<F14NodeSet<f14::MoveOnlyTestInt>>();
}

TEST(F14VectorSet, eraseInto) {
  runEraseIntoTest<F14VectorSet<f14::MoveOnlyTestInt>>();
}

TEST(F14FastSet, eraseInto) {
  runEraseIntoTest<F14FastSet<f14::MoveOnlyTestInt>>();
}

TEST(F14ValueSet, heterogeneous) {
  // note: std::string is implicitly convertible to but not from StringPiece
  using Hasher = folly::transparent<folly::hasher<folly::StringPiece>>;
  using KeyEqual = folly::transparent<std::equal_to<folly::StringPiece>>;

  constexpr auto hello = "hello"_sp;
  constexpr auto buddy = "buddy"_sp;
  constexpr auto world = "world"_sp;

  F14ValueSet<std::string, Hasher, KeyEqual> set;
  set.emplace(hello);
  set.emplace(world);

  auto checks = [hello, buddy](auto& ref) {
    // count
    EXPECT_EQ(0, ref.count(buddy));
    EXPECT_EQ(1, ref.count(hello));

    // find
    EXPECT_TRUE(ref.end() == ref.find(buddy));
    EXPECT_EQ(hello, *ref.find(hello));

    // prehash + find
    EXPECT_TRUE(ref.end() == ref.find(ref.prehash(buddy), buddy));
    EXPECT_EQ(hello, *ref.find(ref.prehash(hello), hello));

    // equal_range
    EXPECT_TRUE(std::make_pair(ref.end(), ref.end()) == ref.equal_range(buddy));
    EXPECT_TRUE(
        std::make_pair(ref.find(hello), ++ref.find(hello)) ==
        ref.equal_range(hello));
  };

  checks(set);
  checks(folly::as_const(set));
}

template <typename S>
void runStatefulFunctorTest() {
  bool ranHasher = false;
  bool ranEqual = false;
  bool ranAlloc = false;
  bool ranDealloc = false;

  auto hasher = [&](int x) {
    ranHasher = true;
    return x;
  };
  auto equal = [&](int x, int y) {
    ranEqual = true;
    return x == y;
  };
  auto alloc = [&](std::size_t n) {
    ranAlloc = true;
    return std::malloc(n);
  };
  auto dealloc = [&](void* p, std::size_t) {
    ranDealloc = true;
    std::free(p);
  };

  {
    S set(0, hasher, equal, {alloc, dealloc});
    set.insert(10);
    set.insert(10);
    EXPECT_EQ(set.size(), 1);

    S set2(set);
    S set3(std::move(set));
    set = set2;
    set2.clear();
    set2 = std::move(set3);
  }
  EXPECT_TRUE(ranHasher);
  EXPECT_TRUE(ranEqual);
  EXPECT_TRUE(ranAlloc);
  EXPECT_TRUE(ranDealloc);
}

TEST(F14ValueSet, statefulFunctors) {
  runStatefulFunctorTest<F14ValueSet<
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<int>>>();
}

TEST(F14NodeSet, statefulFunctors) {
  runStatefulFunctorTest<F14NodeSet<
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<int>>>();
}

TEST(F14VectorSet, statefulFunctors) {
  runStatefulFunctorTest<F14VectorSet<
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<int>>>();
}

TEST(F14FastSet, statefulFunctors) {
  runStatefulFunctorTest<F14FastSet<
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<int>>>();
}

template <typename S>
void runHeterogeneousInsertTest() {
  S set;

  resetTracking();
  EXPECT_EQ(set.count(10), 0);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  set.insert(10);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 1}), 0)
      << Tracked<1>::counts;

  resetTracking();
  int k = 10;
  std::vector<int> v({10});
  set.insert(10);
  set.insert(k);
  set.insert(v.begin(), v.end());
  set.insert(
      std::make_move_iterator(v.begin()), std::make_move_iterator(v.end()));
  set.emplace(10);
  set.emplace(k);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  set.erase(20);
  EXPECT_EQ(set.size(), 1);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  set.erase(10);
  EXPECT_EQ(set.size(), 0);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  set.insert(10);
  resetTracking();
  set.eraseInto(10, [](auto&&) {});
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;
}

template <typename S>
void runHeterogeneousInsertStringTest() {
  S set;
  StringPiece k{"foo"};
  std::vector<StringPiece> v{k};

  set.insert(k);
  set.insert("foo");
  set.insert(StringPiece{"foo"});
  set.insert(v.begin(), v.end());
  set.insert(
      std::make_move_iterator(v.begin()), std::make_move_iterator(v.end()));

  set.emplace();
  set.emplace(k);
  set.emplace("foo");
  set.emplace(StringPiece("foo"));

  set.erase("");
  set.erase(k);
  set.erase(StringPiece{"foo"});
  EXPECT_TRUE(set.empty());
}

TEST(F14ValueSet, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14ValueSet<
      Tracked<1>,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14ValueSet<
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14NodeSet, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14NodeSet<
      Tracked<1>,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14NodeSet<
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14VectorSet, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14VectorSet<
      Tracked<1>,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14VectorSet<
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14FastSet, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14FastSet<
      Tracked<1>,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14FastSet<
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

namespace {
struct CharArrayHasher {
  template <std::size_t N>
  std::size_t operator()(std::array<char, N> const& value) const {
    return folly::Hash{}(
        StringPiece{value.data(), &value.data()[value.size()]});
  }
};

template <
    template <typename, typename, typename, typename> class S,
    std::size_t N>
struct RunAllValueSizeTests {
  void operator()() const {
    using Key = std::array<char, N>;
    static_assert(sizeof(Key) == N, "");
    S<Key, CharArrayHasher, std::equal_to<Key>, std::allocator<Key>> set;

    for (int i = 0; i < 100; ++i) {
      Key key{{static_cast<char>(i)}};
      set.insert(key);
    }
    while (!set.empty()) {
      set.erase(set.begin());
    }

    RunAllValueSizeTests<S, N - 1>{}();
  }
};

template <template <typename, typename, typename, typename> class S>
struct RunAllValueSizeTests<S, 0> {
  void operator()() const {}
};
} // namespace

TEST(F14ValueSet, valueSize) {
  RunAllValueSizeTests<F14ValueSet, 32>{}();
}

///////////////////////////////////
#endif // FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
///////////////////////////////////
