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

#include <folly/container/F14Map.h>

#include <algorithm>
#include <unordered_map>

#include <folly/Conv.h>
#include <folly/FBString.h>
#include <folly/container/test/F14TestUtil.h>
#include <folly/portability/GTest.h>

template <template <typename, typename, typename, typename, typename>
          class TMap>
void testCustomSwap() {
  using std::swap;

  TMap<
      int,
      int,
      folly::f14::DefaultHasher<int>,
      folly::f14::DefaultKeyEqual<int>,
      folly::f14::SwapTrackingAlloc<std::pair<int const, int>>>
      m0, m1;
  folly::f14::resetTracking();
  swap(m0, m1);

  EXPECT_EQ(
      0, folly::f14::Tracked<0>::counts.dist(folly::f14::Counts{0, 0, 0, 0}));
}

TEST(F14Map, customSwap) {
  testCustomSwap<folly::F14ValueMap>();
  testCustomSwap<folly::F14NodeMap>();
  testCustomSwap<folly::F14VectorMap>();
  testCustomSwap<folly::F14FastMap>();
}

namespace {
template <
    template <typename, typename, typename, typename, typename> class TMap,
    typename K,
    typename V>
void runAllocatedMemorySizeTest() {
  using namespace folly::f14;
  using namespace folly::f14::detail;
  using A = SwapTrackingAlloc<std::pair<const K, V>>;

  resetTracking();
  {
    TMap<K, V, DefaultHasher<K>, DefaultKeyEqual<K>, A> m;

    // if F14 intrinsics are not available then we fall back to using
    // std::unordered_map underneath, but in that case the allocation
    // info is only best effort
    bool preciseAllocInfo = getF14IntrinsicsMode() != F14IntrinsicsMode::None;

    if (preciseAllocInfo) {
      EXPECT_EQ(testAllocatedMemorySize, 0);
      EXPECT_EQ(m.getAllocatedMemorySize(), 0);
    }
    auto emptyMapAllocatedMemorySize = testAllocatedMemorySize;
    auto emptyMapAllocatedBlockCount = testAllocatedBlockCount;

    for (size_t i = 0; i < 1000; ++i) {
      m.insert(std::make_pair(folly::to<K>(i), V{}));
      m.erase(folly::to<K>(i / 10 + 2));
      if (preciseAllocInfo) {
        EXPECT_EQ(testAllocatedMemorySize, m.getAllocatedMemorySize());
      }
      EXPECT_GE(m.getAllocatedMemorySize(), sizeof(std::pair<K, V>) * m.size());
      std::size_t size = 0;
      std::size_t count = 0;
      m.visitAllocationClasses([&](std::size_t, std::size_t) mutable {});
      m.visitAllocationClasses([&](std::size_t bytes, std::size_t n) {
        size += bytes * n;
        count += n;
      });
      if (preciseAllocInfo) {
        EXPECT_EQ(testAllocatedMemorySize, size);
        EXPECT_EQ(testAllocatedBlockCount, count);
      }
    }

    m = decltype(m){};
    EXPECT_EQ(testAllocatedMemorySize, emptyMapAllocatedMemorySize);
    EXPECT_EQ(testAllocatedBlockCount, emptyMapAllocatedBlockCount);

    m.reserve(5);
    EXPECT_GT(testAllocatedMemorySize, 0);
    m = {};
    EXPECT_GT(testAllocatedMemorySize, 0);
  }
  EXPECT_EQ(testAllocatedMemorySize, 0);
  EXPECT_EQ(testAllocatedBlockCount, 0);
}

template <typename K, typename V>
void runAllocatedMemorySizeTests() {
  runAllocatedMemorySizeTest<folly::F14ValueMap, K, V>();
  runAllocatedMemorySizeTest<folly::F14NodeMap, K, V>();
  runAllocatedMemorySizeTest<folly::F14VectorMap, K, V>();
  runAllocatedMemorySizeTest<folly::F14FastMap, K, V>();
}
} // namespace

TEST(F14Map, getAllocatedMemorySize) {
  runAllocatedMemorySizeTests<bool, bool>();
  runAllocatedMemorySizeTests<int, int>();
  runAllocatedMemorySizeTests<bool, std::string>();
  runAllocatedMemorySizeTests<double, std::string>();
  runAllocatedMemorySizeTests<std::string, int>();
  runAllocatedMemorySizeTests<std::string, std::string>();
  runAllocatedMemorySizeTests<folly::fbstring, long>();
}

template <typename M>
void runVisitContiguousRangesTest(int n) {
  M map;

  for (int i = 0; i < n; ++i) {
    map[i] = i;
    map.erase(i / 2);
  }

  std::unordered_map<uintptr_t, bool> visited;
  for (auto& entry : map) {
    visited[reinterpret_cast<uintptr_t>(&entry)] = false;
  }

  map.visitContiguousRanges([&](auto b, auto e) {
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

template <typename M>
void runVisitContiguousRangesTest() {
  runVisitContiguousRangesTest<M>(0); // empty
  runVisitContiguousRangesTest<M>(5); // single chunk
  runVisitContiguousRangesTest<M>(1000); // many chunks
}

TEST(F14ValueMap, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14ValueMap<int, int>>();
}

TEST(F14NodeMap, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14NodeMap<int, int>>();
}

TEST(F14VectorMap, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14VectorMap<int, int>>();
}

TEST(F14FastMap, visitContiguousRanges) {
  runVisitContiguousRangesTest<folly::F14FastMap<int, int>>();
}

///////////////////////////////////
#if FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
///////////////////////////////////

#include <chrono>
#include <random>
#include <string>
#include <typeinfo>
#include <unordered_map>

#include <folly/Range.h>
#include <folly/hash/Hash.h>

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

  h.insert(std::make_pair(s("abc"), s("ABC")));
  EXPECT_TRUE(h.find(s("def")) == h.end());
  EXPECT_FALSE(h.find(s("abc")) == h.end());
  EXPECT_EQ(h[s("abc")], s("ABC"));
  h[s("ghi")] = s("GHI");
  EXPECT_EQ(h.size(), 2);
  h.erase(h.find(s("abc")));
  EXPECT_EQ(h.size(), 1);

  T h2(std::move(h));
  EXPECT_EQ(h.size(), 0);
  EXPECT_TRUE(h.begin() == h.end());
  EXPECT_EQ(h2.size(), 1);

  EXPECT_TRUE(h2.find(s("abc")) == h2.end());
  EXPECT_EQ(h2.begin()->first, s("ghi"));
  {
    auto i = h2.begin();
    EXPECT_FALSE(i == h2.end());
    ++i;
    EXPECT_TRUE(i == h2.end());
  }

  T h3;
  h3.try_emplace(s("xxx"));
  h3.insert_or_assign(s("yyy"), s("YYY"));
  h3 = std::move(h2);
  EXPECT_EQ(h2.size(), 0);
  EXPECT_EQ(h3.size(), 1);
  EXPECT_TRUE(h3.find(s("xxx")) == h3.end());

  for (uint64_t i = 0; i < 1000; ++i) {
    h[to<std::string>(i * i * i)] = s("x");
    EXPECT_EQ(h.size(), i + 1);
  }
  {
    using std::swap;
    swap(h, h2);
  }
  for (uint64_t i = 0; i < 1000; ++i) {
    EXPECT_TRUE(h2.find(to<std::string>(i * i * i)) != h2.end());
    EXPECT_EQ(
        h2.find(to<std::string>(i * i * i))->first, to<std::string>(i * i * i));
    EXPECT_TRUE(h2.find(to<std::string>(i * i * i + 2)) == h2.end());
  }

  T h4{h2};
  EXPECT_EQ(h2.size(), 1000);
  EXPECT_EQ(h4.size(), 1000);

  T h5{std::move(h2)};
  T h6;
  h6 = h4;
  T h7 = h4;
  T h8({{s("abc"), s("ABC")}, {s("def"), s("DEF")}});
  T h9({{s("abc"), s("ABD")}, {s("def"), s("DEF")}});
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

  EXPECT_TRUE(h2 == h7);
  EXPECT_TRUE(h4 != h7);

  EXPECT_EQ(h3.at(s("ghi")), s("GHI"));
  EXPECT_THROW(h3.at(s("abc")), std::out_of_range);

  h8.clear();
  h8.emplace(s("abc"), s("ABC"));
  EXPECT_GE(h8.bucket_count(), 1);
  h8 = {};
  EXPECT_GE(h8.bucket_count(), 1);
  h9 = {{s("abc"), s("ABD")}, {s("def"), s("DEF")}};
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
  F14TableStats::compute(h9);
}

template <typename T>
void runRehash() {
  unsigned n = 10000;
  T h;
  auto b = h.bucket_count();
  for (unsigned i = 0; i < n; ++i) {
    h.insert(std::make_pair(to<std::string>(i), s("")));
    if (b != h.bucket_count()) {
      F14TableStats::compute(h);
      b = h.bucket_count();
    }
  }
  EXPECT_EQ(h.size(), n);
  F14TableStats::compute(h);
}

// T should be a map from uint64_t to Tracked<1> that uses SwapTrackingAlloc
template <typename T>
void runRandom() {
  using R = std::unordered_map<uint64_t, Tracked<2>>;

  resetTracking();

  std::mt19937_64 gen(0);
  std::uniform_int_distribution<> pctDist(0, 100);
  std::uniform_int_distribution<uint64_t> bitsBitsDist(1, 6);
  {
    T t0;
    T t1;
    R r0;
    R r1;
    std::size_t rollbacks = 0;
    std::size_t resizingSmallRollbacks = 0;
    std::size_t resizingLargeRollbacks = 0;

    for (std::size_t reps = 0; reps < 100000 || rollbacks < 10 ||
         resizingSmallRollbacks < 1 || resizingLargeRollbacks < 1;
         ++reps) {
      if (pctDist(gen) < 20) {
        // 10% chance allocator will fail after 0 to 3 more allocations
        limitTestAllocations(gen() & 3);
      } else {
        unlimitTestAllocations();
      }
      bool leakCheckOnly = false;

      // discardBits will be from 0 to 62
      auto discardBits = (uint64_t{1} << bitsBitsDist(gen)) - 2;
      auto k = gen() >> discardBits;
      auto v = gen();
      auto pct = pctDist(gen);

      try {
        EXPECT_EQ(t0.empty(), r0.empty());
        EXPECT_EQ(t0.size(), r0.size());
        EXPECT_EQ(2, Tracked<0>::counts.liveCount());
        EXPECT_EQ(t0.size() + t1.size(), Tracked<1>::counts.liveCount());
        EXPECT_EQ(r0.size() + r1.size(), Tracked<2>::counts.liveCount());
        if (pct < 15) {
          // insert
          auto t = t0.insert(std::make_pair(k, v));
          auto r = r0.insert(std::make_pair(k, v));
          EXPECT_EQ(t.first->first, r.first->first);
          EXPECT_EQ(t.first->second.val_, r.first->second.val_);
          EXPECT_EQ(t.second, r.second);
        } else if (pct < 25) {
          // emplace
          auto t = t0.emplace(k, v);
          auto r = r0.emplace(k, v);
          EXPECT_EQ(t.first->first, r.first->first);
          EXPECT_EQ(t.first->second.val_, r.first->second.val_);
          EXPECT_EQ(t.second, r.second);
        } else if (pct < 30) {
          // bulk insert
          leakCheckOnly = true;
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
            k = r->first;
            auto t = t0.find(k);
            t = t0.erase(t);
            if (t != t0.end()) {
              EXPECT_NE(t->first, k);
            }
            r = r0.erase(r);
            if (r != r0.end()) {
              EXPECT_NE(r->first, k);
            }
          }
        } else if (pct < 50) {
          // bulk erase
          if (t0.size() > 0) {
            auto r = r0.find(k);
            if (r == r0.end()) {
              r = r0.begin();
            }
            k = r->first;
            auto t = t0.find(k);
            auto firstt = t;
            auto lastt = ++t;
            t = t0.erase(firstt, lastt);
            if (t != t0.end()) {
              EXPECT_NE(t->first, k);
            }
            auto firstr = r;
            auto lastr = ++r;
            r = r0.erase(firstr, lastr);
            if (r != r0.end()) {
              EXPECT_NE(r->first, k);
            }
          }
        } else if (pct < 58) {
          // find
          auto t = t0.find(k);
          auto r = r0.find(k);
          EXPECT_EQ((t == t0.end()), (r == r0.end()));
          if (t != t0.end() && r != r0.end()) {
            EXPECT_EQ(t->first, r->first);
            EXPECT_EQ(t->second.val_, r->second.val_);
          }
          EXPECT_EQ(t0.count(k), r0.count(k));
        } else if (pct < 60) {
          // equal_range
          auto t = t0.equal_range(k);
          auto r = r0.equal_range(k);
          EXPECT_EQ((t.first == t.second), (r.first == r.second));
          if (t.first != t.second && r.first != r.second) {
            EXPECT_EQ(t.first->first, r.first->first);
            EXPECT_EQ(t.first->second.val_, r.first->second.val_);
            t.first++;
            r.first++;
            EXPECT_TRUE(t.first == t.second);
            EXPECT_TRUE(r.first == r.second);
          }
        } else if (pct < 65) {
          // iterate
          uint64_t t = 0;
          for (auto& e : t0) {
            t += e.first * 37 + e.second.val_ + 1000;
          }
          uint64_t r = 0;
          for (auto& e : r0) {
            r += e.first * 37 + e.second.val_ + 1000;
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
          T t(capacity);
          t0 = std::move(t);
          R r(capacity);
          r0 = std::move(r);
        } else if (pct < 80) {
          // bulk iterator construct
          t0 = T{t1.begin(), t1.end()};
          r0 = R{r1.begin(), r1.end()};
        } else if (pct < 82) {
          // initializer list construct
          auto k2 = gen() >> discardBits;
          auto v2 = gen();
          T t({{k, v}, {k2, v}, {k2, v2}});
          t0 = std::move(t);
          R r({{k, v}, {k2, v}, {k2, v2}});
          r0 = std::move(r);
        } else if (pct < 85) {
          // copy construct
          T t(t1);
          t0 = std::move(t);
          R r(r1);
          r0 = std::move(r);
        } else if (pct < 88) {
          // copy construct
          T t(t1, t1.get_allocator());
          t0 = std::move(t);
          R r(r1, r1.get_allocator());
          r0 = std::move(r);
        } else if (pct < 89) {
          // move construct
          t0.~T();
          new (&t0) T(std::move(t1));
          r0.~R();
          new (&r0) R(std::move(r1));
        } else if (pct < 90) {
          // move construct
          t0.~T();
          auto ta = t1.get_allocator();
          new (&t0) T(std::move(t1), ta);
          r0.~R();
          auto ra = r1.get_allocator();
          new (&r0) R(std::move(r1), ra);
        } else if (pct < 94) {
          // copy assign
          leakCheckOnly = true;
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
          F14TableStats::compute(t0);
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
      } catch (std::bad_alloc const&) {
        ++rollbacks;

        F14TableStats::compute(t0);

        if (leakCheckOnly) {
          unlimitTestAllocations();
          t0.clear();
          for (auto&& kv : r0) {
            t0[kv.first] = kv.second.val_;
          }
        }

        if (t0.bucket_count() == t0.size() && t0.size() > 0) {
          if (t0.size() < 10) {
            ++resizingSmallRollbacks;
          } else {
            ++resizingLargeRollbacks;
          }
        }

        assert(t0.size() == r0.size());
        for (auto&& kv : r0) {
          auto t = t0.find(kv.first);
          EXPECT_TRUE(
              t != t0.end() && t->first == kv.first &&
              t->second.val_ == kv.second.val_);
        }
      }
    }
  }

  EXPECT_EQ(testAllocatedMemorySize, 0);
}

template <typename T>
void runPrehash() {
  T h;

  EXPECT_EQ(h.size(), 0);

  h.insert(std::make_pair(s("abc"), s("ABC")));
  EXPECT_TRUE(h.find(s("def")) == h.end());
  EXPECT_FALSE(h.find(s("abc")) == h.end());

  auto t1 = h.prehash(s("def"));
  F14HashToken t2;
  t2 = h.prehash(s("abc"));
  EXPECT_TRUE(h.find(t1, s("def")) == h.end());
  EXPECT_FALSE(h.find(t2, s("abc")) == h.end());
}

TEST(F14ValueMap, simple) {
  runSimple<F14ValueMap<std::string, std::string>>();
}

TEST(F14NodeMap, simple) {
  runSimple<F14NodeMap<std::string, std::string>>();
}

TEST(F14VectorMap, simple) {
  runSimple<F14VectorMap<std::string, std::string>>();
}

TEST(F14FastMap, simple) {
  runSimple<F14FastMap<std::string, std::string>>();
}

TEST(F14VectorMap, reverse_iterator) {
  using TMap = F14VectorMap<uint64_t, uint64_t>;
  auto populate = [](TMap& h, uint64_t lo, uint64_t hi) {
    for (auto i = lo; i < hi; ++i) {
      h.emplace(i, i);
    }
  };
  auto verify = [](TMap const& h, uint64_t lo, uint64_t hi) {
    auto loIt = h.find(lo);
    EXPECT_NE(h.end(), loIt);
    uint64_t val = lo;
    for (auto rit = h.riter(loIt); rit != h.rend(); ++rit) {
      EXPECT_EQ(val, rit->first);
      EXPECT_EQ(val, rit->second);
      TMap::const_iterator it = h.iter(rit);
      EXPECT_EQ(val, it->first);
      EXPECT_EQ(val, it->second);
      val++;
    }
    EXPECT_EQ(hi, val);
  };
  TMap h;
  size_t prevSize = 0;
  size_t newSize = 1;
  // verify iteration order across rehashes, copies, and moves
  while (newSize < 10'000) {
    populate(h, prevSize, newSize);
    verify(h, 0, newSize);
    verify(h, newSize / 2, newSize);

    TMap h2{h};
    verify(h2, 0, newSize);

    h = std::move(h2);
    verify(h, 0, newSize);
    prevSize = newSize;
    newSize *= 10;
  }
}

TEST(F14ValueMap, rehash) {
  runRehash<F14ValueMap<std::string, std::string>>();
}

TEST(F14NodeMap, rehash) {
  runRehash<F14NodeMap<std::string, std::string>>();
}

TEST(F14VectorMap, rehash) {
  runRehash<F14VectorMap<std::string, std::string>>();
}

TEST(F14ValueMap, prehash) {
  runPrehash<F14ValueMap<std::string, std::string>>();
}

TEST(F14NodeMap, prehash) {
  runPrehash<F14NodeMap<std::string, std::string>>();
}

TEST(F14ValueMap, random) {
  runRandom<F14ValueMap<
      uint64_t,
      Tracked<1>,
      std::hash<uint64_t>,
      std::equal_to<uint64_t>,
      SwapTrackingAlloc<std::pair<uint64_t const, Tracked<1>>>>>();
}

TEST(F14NodeMap, random) {
  runRandom<F14NodeMap<
      uint64_t,
      Tracked<1>,
      std::hash<uint64_t>,
      std::equal_to<uint64_t>,
      SwapTrackingAlloc<std::pair<uint64_t const, Tracked<1>>>>>();
}

TEST(F14VectorMap, random) {
  runRandom<F14VectorMap<
      uint64_t,
      Tracked<1>,
      std::hash<uint64_t>,
      std::equal_to<uint64_t>,
      SwapTrackingAlloc<std::pair<uint64_t const, Tracked<1>>>>>();
}

TEST(F14FastMap, random) {
  runRandom<F14FastMap<
      uint64_t,
      Tracked<1>,
      std::hash<uint64_t>,
      std::equal_to<uint64_t>,
      SwapTrackingAlloc<std::pair<uint64_t const, Tracked<1>>>>>();
}

TEST(F14ValueMap, grow_stats) {
  F14ValueMap<uint64_t, uint64_t> h;
  for (unsigned i = 1; i <= 3072; ++i) {
    h[i]++;
  }
  // F14ValueMap just before rehash
  F14TableStats::compute(h);
  h[0]++;
  // F14ValueMap just after rehash
  F14TableStats::compute(h);
}

TEST(F14ValueMap, steady_state_stats) {
  // 10k keys, 14% probability of insert, 90% chance of erase, so the
  // table should converge to 1400 size without triggering the rehash
  // that would occur at 1536.
  F14ValueMap<uint64_t, uint64_t> h;
  std::mt19937_64 gen(0);
  std::uniform_int_distribution<> dist(0, 10000);
  for (std::size_t i = 0; i < 100000; ++i) {
    auto key = dist(gen);
    if (dist(gen) < 1400) {
      h.insert_or_assign(key, i);
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
  // F14ValueMap at steady state
  F14TableStats::compute(h);
}

TEST(F14VectorMap, steady_state_stats) {
  // 10k keys, 14% probability of insert, 90% chance of erase, so the
  // table should converge to 1400 size without triggering the rehash
  // that would occur at 1536.
  F14VectorMap<std::string, uint64_t> h;
  std::mt19937_64 gen(0);
  std::uniform_int_distribution<> dist(0, 10000);
  for (std::size_t i = 0; i < 100000; ++i) {
    auto key = "0123456789ABCDEFGHIJKLMNOPQ" + to<std::string>(dist(gen));
    if (dist(gen) < 1400) {
      h.insert_or_assign(key, i);
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
  // F14ValueMap at steady state
  F14TableStats::compute(h);
}

TEST(Tracked, baseline) {
  Tracked<0> a0;

  {
    resetTracking();
    Tracked<0> b0{a0};
    EXPECT_EQ(a0.val_, b0.val_);
    EXPECT_EQ(sumCounts, (Counts{1, 0, 0, 0}));
    EXPECT_EQ(Tracked<0>::counts, (Counts{1, 0, 0, 0}));
  }
  {
    resetTracking();
    Tracked<0> b0{std::move(a0)};
    EXPECT_EQ(a0.val_, b0.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 1, 0, 0}));
    EXPECT_EQ(Tracked<0>::counts, (Counts{0, 1, 0, 0}));
  }
  {
    resetTracking();
    Tracked<1> b1{a0};
    EXPECT_EQ(a0.val_, b1.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 1, 0}));
    EXPECT_EQ(Tracked<1>::counts, (Counts{0, 0, 1, 0}));
  }
  {
    resetTracking();
    Tracked<1> b1{std::move(a0)};
    EXPECT_EQ(a0.val_, b1.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 0, 1}));
    EXPECT_EQ(Tracked<1>::counts, (Counts{0, 0, 0, 1}));
  }
  {
    Tracked<0> b0;
    resetTracking();
    b0 = a0;
    EXPECT_EQ(a0.val_, b0.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 0, 0, 1, 0}));
    EXPECT_EQ(Tracked<0>::counts, (Counts{0, 0, 0, 0, 1, 0}));
  }
  {
    Tracked<0> b0;
    resetTracking();
    b0 = std::move(a0);
    EXPECT_EQ(a0.val_, b0.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 0, 0, 0, 1}));
    EXPECT_EQ(Tracked<0>::counts, (Counts{0, 0, 0, 0, 0, 1}));
  }
  {
    Tracked<1> b1;
    resetTracking();
    b1 = a0;
    EXPECT_EQ(a0.val_, b1.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 1, 0, 0, 1, 0, 1}));
    EXPECT_EQ(Tracked<1>::counts, (Counts{0, 0, 1, 0, 0, 1, 0, 1}));
  }
  {
    Tracked<1> b1;
    resetTracking();
    b1 = std::move(a0);
    EXPECT_EQ(a0.val_, b1.val_);
    EXPECT_EQ(sumCounts, (Counts{0, 0, 0, 1, 0, 1, 0, 1}));
    EXPECT_EQ(Tracked<1>::counts, (Counts{0, 0, 0, 1, 0, 1, 0, 1}));
  }
}

// M should be a map from Tracked<0> to Tracked<1>.  F should take a map
// and a pair const& or pair&& and cause it to be inserted
template <typename M, typename F>
void runInsertCases(
    std::string const& name,
    F const& insertFunc,
    uint64_t expectedDist = 0) {
  static_assert(std::is_same<typename M::key_type, Tracked<0>>::value, "");
  static_assert(std::is_same<typename M::mapped_type, Tracked<1>>::value, "");
  {
    typename M::value_type p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, p);
    // fresh key, value_type const& ->
    // copy is expected
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{1, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{1, 0, 0, 0}),
        expectedDist)
        << name << "\n0 -> " << Tracked<0>::counts << "\n1 -> "
        << Tracked<1>::counts;
  }
  {
    typename M::value_type p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, std::move(p));
    // fresh key, value_type&& ->
    // key copy is unfortunate but required
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{1, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 1, 0, 0}),
        expectedDist)
        << name << "\n0 -> " << Tracked<0>::counts << "\n1 -> "
        << Tracked<1>::counts;
  }
  {
    std::pair<Tracked<0>, Tracked<1>> p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, p);
    // fresh key, pair<key_type,mapped_type> const& ->
    // 1 copy is required
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{1, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{1, 0, 0, 0}),
        expectedDist)
        << name << "\n0 -> " << Tracked<0>::counts << "\n1 -> "
        << Tracked<1>::counts;
  }
  {
    std::pair<Tracked<0>, Tracked<1>> p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, std::move(p));
    // fresh key, pair<key_type,mapped_type>&& ->
    // this is the happy path for insert(make_pair(.., ..))
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 1, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 1, 0, 0}),
        expectedDist)
        << name << "\n0 -> " << Tracked<0>::counts << "\n1 -> "
        << Tracked<1>::counts;
  }
  {
    std::pair<Tracked<2>, Tracked<3>> p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, p);
    // fresh key, convertible const& ->
    //   key_type ops: Tracked<0>::counts
    //   mapped_type ops: Tracked<1>::counts
    //   key_src ops: Tracked<2>::counts
    //   mapped_src ops: Tracked<3>::counts;

    // There are three strategies that could be optimal for particular
    // ratios of cost:
    //
    // - convert key and value in place to final position, destroy if
    //   insert fails. This is the strategy used by std::unordered_map
    //   and FBHashMap
    //
    // - convert key and default value in place to final position,
    //   convert value only if insert succeeds.  Nobody uses this strategy
    //
    // - convert key to a temporary, move key and convert value if
    //   insert succeeds.  This is the strategy used by F14 and what is
    //   EXPECT_EQ here.

    // The expectedDist * 3 is just a hack for the emplace-pieces-by-value
    // test, whose test harness copies the original pair and then uses
    // move conversion instead of copy conversion.
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 1, 1, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 1, 0}) +
            Tracked<2>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<3>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist * 3);
  }
  {
    std::pair<Tracked<2>, Tracked<3>> p{0, 0};
    M m;
    resetTracking();
    insertFunc(m, std::move(p));
    // fresh key, convertible&& ->
    //   key_type ops: Tracked<0>::counts
    //   mapped_type ops: Tracked<1>::counts
    //   key_src ops: Tracked<2>::counts
    //   mapped_src ops: Tracked<3>::counts;
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 1, 0, 1}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 1}) +
            Tracked<2>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<3>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
  }
  {
    typename M::value_type p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, p);
    // duplicate key, value_type const&
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
  }
  {
    typename M::value_type p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, std::move(p));
    // duplicate key, value_type&&
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
  }
  {
    std::pair<Tracked<0>, Tracked<1>> p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, p);
    // duplicate key, pair<key_type,mapped_type> const&
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
  }
  {
    std::pair<Tracked<0>, Tracked<1>> p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, std::move(p));
    // duplicate key, pair<key_type,mapped_type>&&
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
  }
  {
    std::pair<Tracked<2>, Tracked<3>> p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, p);
    // duplicate key, convertible const& ->
    //   key_type ops: Tracked<0>::counts
    //   mapped_type ops: Tracked<1>::counts
    //   key_src ops: Tracked<2>::counts
    //   mapped_src ops: Tracked<3>::counts;
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 1, 0}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<2>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<3>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist * 2);
  }
  {
    std::pair<Tracked<2>, Tracked<3>> p{0, 0};
    M m;
    m[0] = 0;
    resetTracking();
    insertFunc(m, std::move(p));
    // duplicate key, convertible&& ->
    //   key_type ops: Tracked<0>::counts
    //   mapped_type ops: Tracked<1>::counts
    //   key_src ops: Tracked<2>::counts
    //   mapped_src ops: Tracked<3>::counts;
    EXPECT_EQ(
        Tracked<0>::counts.dist(Counts{0, 0, 0, 1}) +
            Tracked<1>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<2>::counts.dist(Counts{0, 0, 0, 0}) +
            Tracked<3>::counts.dist(Counts{0, 0, 0, 0}),
        expectedDist);
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

struct DoEmplace2 {
  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2> const& p) const {
    m.emplace(p.first, p.second);
  }

  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2>&& p) const {
    m.emplace(std::move(p.first), std::move(p.second));
  }
};

struct DoEmplace3 {
  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2> const& p) const {
    m.emplace(
        std::piecewise_construct,
        std::forward_as_tuple(p.first),
        std::forward_as_tuple(p.second));
  }

  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2>&& p) const {
    m.emplace(
        std::piecewise_construct,
        std::forward_as_tuple(std::move(p.first)),
        std::forward_as_tuple(std::move(p.second)));
  }
};

// Simulates use of piecewise_construct without proper use of
// forward_as_tuple.  This code doesn't yield the normal pattern, but
// it should have exactly 1 additional move or copy of the key and 1
// additional move or copy of the mapped value.
struct DoEmplace3Value {
  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2> const& p) const {
    m.emplace(
        std::piecewise_construct,
        std::tuple<U1>{p.first},
        std::tuple<U2>{p.second});
  }

  template <typename M, typename U1, typename U2>
  void operator()(M& m, std::pair<U1, U2>&& p) const {
    m.emplace(
        std::piecewise_construct,
        std::tuple<U1>{std::move(p.first)},
        std::tuple<U2>{std::move(p.second)});
  }
};

template <typename M>
void runInsertAndEmplace(std::string const& name) {
  runInsertCases<M>(name + " insert", DoInsert{});
  runInsertCases<M>(name + " emplace pair", DoEmplace1{});
  runInsertCases<M>(name + " emplace k,v", DoEmplace2{});
  runInsertCases<M>(name + " emplace pieces", DoEmplace3{});
  runInsertCases<M>(name + " emplace pieces by value", DoEmplace3Value{}, 2);

  // Calling the default pair constructor via emplace is valid, but not
  // very useful in real life.  Verify that it works.
  M m;
  typename M::key_type k;
  EXPECT_EQ(m.count(k), 0);
  m.emplace();
  EXPECT_EQ(m.count(k), 1);
  m.emplace();
  EXPECT_EQ(m.count(k), 1);
}

TEST(F14ValueMap, destructuring) {
  runInsertAndEmplace<F14ValueMap<Tracked<0>, Tracked<1>>>("f14value");
}

TEST(F14NodeMap, destructuring) {
  runInsertAndEmplace<F14NodeMap<Tracked<0>, Tracked<1>>>("f14node");
}

TEST(F14VectorMap, destructuring) {
  runInsertAndEmplace<F14VectorMap<Tracked<0>, Tracked<1>>>("f14vector");
}

TEST(F14VectorMap, destructuringErase) {
  using M = F14VectorMap<Tracked<0>, Tracked<1>>;
  typename M::value_type p1{0, 0};
  typename M::value_type p2{2, 2};
  M m;
  m.insert(p1);
  m.insert(p2);

  resetTracking();
  m.erase(p1.first);
  LOG(INFO) << "erase -> "
            << "key_type ops " << Tracked<0>::counts << ", mapped_type ops "
            << Tracked<1>::counts;
  // deleting p1 will cause p2 to be moved to the front of the values array
  EXPECT_EQ(
      Tracked<0>::counts.dist(Counts{0, 1, 0, 0}) +
          Tracked<1>::counts.dist(Counts{0, 1, 0, 0}),
      0);
}

TEST(F14ValueMap, maxSize) {
  F14ValueMap<int, int> m;
  EXPECT_EQ(
      m.max_size(),
      std::numeric_limits<std::size_t>::max() / sizeof(std::pair<int, int>));
}

TEST(F14NodeMap, maxSize) {
  F14NodeMap<int, int> m;
  EXPECT_EQ(
      m.max_size(),
      std::numeric_limits<std::size_t>::max() / sizeof(std::pair<int, int>));
}

TEST(F14VectorMap, vectorMaxSize) {
  F14VectorMap<int, int> m;
  EXPECT_EQ(
      m.max_size(),
      std::min(
          std::size_t{std::numeric_limits<uint32_t>::max()},
          std::numeric_limits<std::size_t>::max() /
              sizeof(std::pair<int, int>)));
}

template <typename M>
void runMoveOnlyTest() {
  M t0;
  t0[10] = 20;
  t0.emplace(30, 40);
  t0.insert(std::make_pair(50, 60));
  M t1{std::move(t0)};
  EXPECT_TRUE(t0.empty());
  M t2;
  EXPECT_TRUE(t2.empty());
  t2 = std::move(t1);
  EXPECT_EQ(t2.size(), 3);
}

TEST(F14ValueMap, moveOnly) {
  runMoveOnlyTest<F14ValueMap<f14::MoveOnlyTestInt, int>>();
  runMoveOnlyTest<F14ValueMap<int, f14::MoveOnlyTestInt>>();
  runMoveOnlyTest<F14ValueMap<f14::MoveOnlyTestInt, f14::MoveOnlyTestInt>>();
}

TEST(F14NodeMap, moveOnly) {
  runMoveOnlyTest<F14NodeMap<f14::MoveOnlyTestInt, int>>();
  runMoveOnlyTest<F14NodeMap<int, f14::MoveOnlyTestInt>>();
  runMoveOnlyTest<F14NodeMap<f14::MoveOnlyTestInt, f14::MoveOnlyTestInt>>();
}

TEST(F14VectorMap, moveOnly) {
  runMoveOnlyTest<F14VectorMap<f14::MoveOnlyTestInt, int>>();
  runMoveOnlyTest<F14VectorMap<int, f14::MoveOnlyTestInt>>();
  runMoveOnlyTest<F14VectorMap<f14::MoveOnlyTestInt, f14::MoveOnlyTestInt>>();
}

TEST(F14FastMap, moveOnly) {
  runMoveOnlyTest<F14FastMap<f14::MoveOnlyTestInt, int>>();
  runMoveOnlyTest<F14FastMap<int, f14::MoveOnlyTestInt>>();
  runMoveOnlyTest<F14FastMap<f14::MoveOnlyTestInt, f14::MoveOnlyTestInt>>();
}

TEST(F14ValueMap, heterogeneousLookup) {
  using Hasher = folly::transparent<folly::hasher<folly::StringPiece>>;
  using KeyEqual = folly::transparent<std::equal_to<folly::StringPiece>>;

  constexpr auto hello = "hello"_sp;
  constexpr auto buddy = "buddy"_sp;
  constexpr auto world = "world"_sp;

  F14ValueMap<std::string, bool, Hasher, KeyEqual> map;
  map.emplace(hello, true);
  map.emplace(world, false);

  auto checks = [hello, buddy](auto& ref) {
    // count
    EXPECT_EQ(0, ref.count(buddy));
    EXPECT_EQ(1, ref.count(hello));

    // find
    EXPECT_TRUE(ref.end() == ref.find(buddy));
    EXPECT_EQ(hello, ref.find(hello)->first);

    // prehash + find
    EXPECT_TRUE(ref.end() == ref.find(ref.prehash(buddy), buddy));
    EXPECT_EQ(hello, ref.find(ref.prehash(hello), hello)->first);

    // equal_range
    EXPECT_TRUE(std::make_pair(ref.end(), ref.end()) == ref.equal_range(buddy));
    EXPECT_TRUE(
        std::make_pair(ref.find(hello), ++ref.find(hello)) ==
        ref.equal_range(hello));
  };

  checks(map);
  checks(folly::as_const(map));
}

template <typename M>
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
    M map(0, hasher, equal, {alloc, dealloc});
    map[10]++;
    map[10]++;
    EXPECT_EQ(map[10], 2);

    M map2(map);
    M map3(std::move(map));
    map = map2;
    map2.clear();
    map2 = std::move(map3);
  }
  EXPECT_TRUE(ranHasher);
  EXPECT_TRUE(ranEqual);
  EXPECT_TRUE(ranAlloc);
  EXPECT_TRUE(ranDealloc);
}

TEST(F14ValueMap, statefulFunctors) {
  runStatefulFunctorTest<F14ValueMap<
      int,
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<std::pair<int const, int>>>>();
}

TEST(F14NodeMap, statefulFunctors) {
  runStatefulFunctorTest<F14NodeMap<
      int,
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<std::pair<int const, int>>>>();
}

TEST(F14VectorMap, statefulFunctors) {
  runStatefulFunctorTest<F14VectorMap<
      int,
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<std::pair<int const, int>>>>();
}

TEST(F14FastMap, statefulFunctors) {
  runStatefulFunctorTest<F14FastMap<
      int,
      int,
      GenericHasher<int>,
      GenericEqual<int>,
      GenericAlloc<std::pair<int const, int>>>>();
}

template <typename M>
void runHeterogeneousInsertTest() {
  M map;

  resetTracking();
  EXPECT_EQ(map.count(10), 0);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  map[10] = 20;
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 1}), 0)
      << Tracked<1>::counts;

  resetTracking();
  std::pair<int, int> p(10, 30);
  std::vector<std::pair<int, int>> v({p});
  map[10] = 30;
  map.insert(std::pair<int, int>(10, 30));
  map.insert(std::pair<int const, int>(10, 30));
  map.insert(p);
  map.insert(v.begin(), v.end());
  map.insert(
      std::make_move_iterator(v.begin()), std::make_move_iterator(v.end()));
  map.insert_or_assign(10, 40);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  map.emplace(10, 30);
  map.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(10),
      std::forward_as_tuple(30));
  map.emplace(p);
  map.try_emplace(10, 30);
  map.try_emplace(10);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;

  resetTracking();
  map.erase(10);
  EXPECT_EQ(map.size(), 0);
  EXPECT_EQ(Tracked<1>::counts.dist(Counts{0, 0, 0, 0}), 0)
      << Tracked<1>::counts;
}

template <typename M>
void runHeterogeneousInsertStringTest() {
  using P = std::pair<StringPiece, std::string>;
  using CP = std::pair<const StringPiece, std::string>;

  M map;
  P p{"foo", "hello"};
  std::vector<P> v{p};
  StringPiece foo{"foo"};

  map.insert(P("foo", "hello"));
  // TODO(T31574848): the list-initialization below does not work on libstdc++
  // versions (e.g., GCC < 6) with no implementation of N4387 ("perfect
  // initialization" for pairs and tuples).
  //   StringPiece sp{"foo"};
  //   map.insert({sp, "hello"});
  map.insert({"foo", "hello"});
  map.insert(CP("foo", "hello"));
  map.insert(p);
  map.insert(v.begin(), v.end());
  map.insert(
      std::make_move_iterator(v.begin()), std::make_move_iterator(v.end()));
  map.insert_or_assign("foo", "hello");
  map.insert_or_assign(StringPiece{"foo"}, "hello");
  EXPECT_EQ(map["foo"], "hello");

  map.emplace(StringPiece{"foo"}, "hello");
  map.emplace("foo", "hello");
  map.emplace(p);
  map.emplace();
  map.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(StringPiece{"foo"}),
      std::forward_as_tuple(/* count */ 20, 'x'));
  map.try_emplace(StringPiece{"foo"}, "hello");
  map.try_emplace(foo, "hello");
  map.try_emplace(foo);
  map.try_emplace("foo");
  map.try_emplace("foo", "hello");
  map.try_emplace("foo", /* count */ 20, 'x');

  map.erase(StringPiece{"foo"});
  map.erase(foo);
  map.erase("");
  EXPECT_TRUE(map.empty());
}

TEST(F14ValueMap, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14ValueMap<
      Tracked<1>,
      int,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14ValueMap<
      std::string,
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14NodeMap, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14NodeMap<
      Tracked<1>,
      int,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14NodeMap<
      std::string,
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14VectorMap, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14VectorMap<
      Tracked<1>,
      int,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14VectorMap<
      std::string,
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

TEST(F14FastMap, heterogeneousInsert) {
  runHeterogeneousInsertTest<F14FastMap<
      Tracked<1>,
      int,
      TransparentTrackedHash<1>,
      TransparentTrackedEqual<1>>>();
  runHeterogeneousInsertStringTest<F14FastMap<
      std::string,
      std::string,
      transparent<hasher<StringPiece>>,
      transparent<DefaultKeyEqual<StringPiece>>>>();
}

///////////////////////////////////
#endif // FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
///////////////////////////////////
