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

#include <folly/AtomicUnorderedMap.h>

#include <semaphore.h>
#include <thread>
#include <unordered_map>

#include <folly/Benchmark.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

using namespace folly;
using namespace folly::test;

template<class T>
struct non_atomic {
  T value;

  non_atomic() = default;
  non_atomic(const non_atomic&) = delete;
  constexpr /* implicit */ non_atomic(T desired): value(desired) {}

  T operator+=(T arg) { value += arg; return load();}

  T load(std::memory_order /* order */ = std::memory_order_seq_cst) const {
    return value;
  }

  /* implicit */
  operator T() const {return load();}

  void store(T desired,
             std::memory_order /* order */ = std::memory_order_seq_cst) {
    value = desired;
  }

  T exchange(T desired,
             std::memory_order /* order */ = std::memory_order_seq_cst) {
    T old = load();
    store(desired);
    return old;
  }

  bool compare_exchange_weak(
      T& expected,
      T desired,
      std::memory_order /* success */ = std::memory_order_seq_cst,
      std::memory_order /* failure */ = std::memory_order_seq_cst) {
    if (value == expected) {
      value = desired;
      return true;
    }

    expected = value;
    return false;
  }

  bool compare_exchange_strong(
      T& expected,
      T desired,
      std::memory_order /* success */ = std::memory_order_seq_cst,
      std::memory_order /* failure */ = std::memory_order_seq_cst) {
    if (value == expected) {
      value = desired;
      return true;
    }

    expected = value;
    return false;
  }

  bool is_lock_free() const {return true;}
};

template <typename Key,
          typename Value,
          typename IndexType,
          template <typename> class Atom = std::atomic,
          typename Allocator = std::allocator<char>>
using UIM =
    AtomicUnorderedInsertMap<Key,
                             Value,
                             std::hash<Key>,
                             std::equal_to<Key>,
                             (boost::has_trivial_destructor<Key>::value &&
                              boost::has_trivial_destructor<Value>::value),
                             Atom,
                             IndexType,
                             Allocator>;

namespace {
template <typename T>
struct AtomicUnorderedInsertMapTest : public ::testing::Test {};
}

// uint16_t doesn't make sense for most platforms, but we might as well
// test it
using IndexTypesToTest = ::testing::Types<uint16_t, uint32_t, uint64_t>;
TYPED_TEST_CASE(AtomicUnorderedInsertMapTest, IndexTypesToTest);

TYPED_TEST(AtomicUnorderedInsertMapTest, basic) {
  UIM<std::string,
      std::string,
      TypeParam,
      std::atomic,
      folly::detail::MMapAlloc> m(100);

  m.emplace("abc", "ABC");
  EXPECT_TRUE(m.find("abc") != m.cend());
  EXPECT_EQ(m.find("abc")->first, "abc");
  EXPECT_EQ(m.find("abc")->second, "ABC");
  EXPECT_TRUE(m.find("def") == m.cend());
  auto iter = m.cbegin();
  EXPECT_TRUE(iter != m.cend());
  EXPECT_TRUE(iter == m.find("abc"));
  auto a = iter;
  EXPECT_TRUE(a == iter);
  auto b = iter;
  ++iter;
  EXPECT_TRUE(iter == m.cend());
  EXPECT_TRUE(a == b);
  EXPECT_TRUE(a != iter);
  a++;
  EXPECT_TRUE(a == iter);
  EXPECT_TRUE(a != b);
}

TEST(AtomicUnorderedInsertMap, load_factor) {
  AtomicUnorderedInsertMap<int, bool> m(5000, 0.5f);

  // we should be able to put in much more than 5000 things because of
  // our load factor request
  for (int i = 0; i < 10000; ++i) {
    m.emplace(i, true);
  }
}

TEST(AtomicUnorderedInsertMap, capacity_exceeded) {
  AtomicUnorderedInsertMap<int, bool> m(5000, 1.0f);

  EXPECT_THROW({
    for (int i = 0; i < 6000; ++i) {
      m.emplace(i, false);
    }
  }, std::bad_alloc);
}

TYPED_TEST(AtomicUnorderedInsertMapTest, value_mutation) {
  UIM<int, MutableAtom<int>, TypeParam> m(100);

  for (int i = 0; i < 50; ++i) {
    m.emplace(i, i);
  }

  m.find(1)->second.data++;
}

TEST(UnorderedInsertMap, value_mutation) {
  UIM<int, MutableData<int>, uint32_t, non_atomic> m(100);

  for (int i = 0; i < 50; ++i) {
    m.emplace(i, i);
  }

  m.find(1)->second.data++;
  EXPECT_EQ(m.find(1)->second.data, 2);
}

// This test is too expensive to run automatically.  On my dev server it
// takes about 10 minutes for dbg build, 2 for opt.
TEST(AtomicUnorderedInsertMap, DISABLED_mega_map) {
  size_t capacity = 2000000000;
  AtomicUnorderedInsertMap64<size_t,size_t> big(capacity);
  for (size_t i = 0; i < capacity * 2; i += 2) {
    big.emplace(i, i * 10);
  }
  for (size_t i = 0; i < capacity * 3; i += capacity / 1000 + 1) {
    auto iter = big.find(i);
    if ((i & 1) == 0 && i < capacity * 2) {
      EXPECT_EQ(iter->second, i * 10);
    } else {
      EXPECT_TRUE(iter == big.cend());
    }
  }
}

BENCHMARK(lookup_int_int_hit, iters) {
  std::unique_ptr<AtomicUnorderedInsertMap<int,size_t>> ptr = {};

  size_t capacity = 100000;

  BENCHMARK_SUSPEND {
    ptr.reset(new AtomicUnorderedInsertMap<int,size_t>(capacity));
    for (size_t i = 0; i < capacity; ++i) {
      auto k = 3 * ((5641 * i) % capacity);
      ptr->emplace(k, k + 1);
      EXPECT_EQ(ptr->find(k)->second, k + 1);
    }
  }

  for (size_t i = 0; i < iters; ++i) {
    size_t k = 3 * (((i * 7919) ^ (i * 4001)) % capacity);
    auto iter = ptr->find(k);
    if (iter == ptr->cend() ||
        iter->second != k + 1) {
      auto jter = ptr->find(k);
      EXPECT_TRUE(iter == jter);
    }
    EXPECT_EQ(iter->second, k + 1);
  }

  BENCHMARK_SUSPEND {
    ptr.reset(nullptr);
  }
}

struct PairHash {
  size_t operator()(const std::pair<uint64_t,uint64_t>& pr) const {
    return pr.first ^ pr.second;
  }
};

void contendedRW(size_t itersPerThread,
                 size_t capacity,
                 size_t numThreads,
                 size_t readsPerWrite) {
  typedef std::pair<uint64_t,uint64_t> Key;
  typedef AtomicUnorderedInsertMap<Key,MutableAtom<uint32_t>,PairHash> Map;

  std::unique_ptr<Map> ptr = {};
  std::atomic<bool> go;
  std::vector<std::thread> threads;

  BENCHMARK_SUSPEND {
    ptr.reset(new Map(capacity));
    while (threads.size() < numThreads) {
      threads.emplace_back([&](){
        while (!go) {
          std::this_thread::yield();
        }

        size_t reads = 0;
        size_t writes = 0;
        while (reads + writes < itersPerThread) {
          auto r = Random::rand32();
          Key key(reads + writes, r);
          if (reads < writes * readsPerWrite ||
              writes >= capacity / numThreads) {
            // read needed
            ++reads;
            auto iter = ptr->find(key);
            EXPECT_TRUE(
                iter == ptr->cend() ||
                iter->second.data.load(std::memory_order_acquire) >= key.first);
          } else {
            ++writes;
            try {
              auto pr = ptr->emplace(key, key.first);
              if (!pr.second) {
                pr.first->second.data++;
              }
            } catch (std::bad_alloc&) {
              LOG(INFO) << "bad alloc";
            }
          }
        }
      });
    }
  }

  go = true;

  for (auto& thr : threads) {
    thr.join();
  }

  BENCHMARK_SUSPEND {
    ptr.reset(nullptr);
  }
}

// sudo nice -n -20 ~/fbcode/_bin/common/concurrency/experimental/atomic_unordered_map --benchmark --bm_min_iters=1000000
//
// without MAP_HUGETLB (default)
//
// ============================================================================
// common/concurrency/experimental/AtomicUnorderedMapTest.cpprelative  time/iter
//   iters/s
// ============================================================================
// lookup_int_int_hit                                          20.05ns   49.89M
// contendedRW(small_32thr_99pct)                              70.36ns   14.21M
// contendedRW(large_32thr_99pct)                             164.23ns    6.09M
// contendedRW(large_32thr_99_9pct)                           158.81ns    6.30M
// ============================================================================
//
// with MAP_HUGETLB hacked in
// ============================================================================
// lookup_int_int_hit                                          19.67ns   50.84M
// contendedRW(small_32thr_99pct)                              62.46ns   16.01M
// contendedRW(large_32thr_99pct)                             119.41ns    8.37M
// contendedRW(large_32thr_99_9pct)                           111.23ns    8.99M
// ============================================================================
BENCHMARK_NAMED_PARAM(contendedRW, small_32thr_99pct, 100000, 32, 99)
BENCHMARK_NAMED_PARAM(contendedRW, large_32thr_99pct, 100000000, 32, 99)
BENCHMARK_NAMED_PARAM(contendedRW, large_32thr_99_9pct, 100000000, 32, 999)

BENCHMARK_DRAW_LINE();

// sudo nice -n -20 ~/fbcode/_build/opt/site_integrity/quasar/experimental/atomic_unordered_map_test --benchmark --bm_min_iters=10000
// Single threaded benchmarks to test how much better we are than
// std::unordered_map and what is the cost of using atomic operations
// in the uncontended use case
// ============================================================================
// std_map                                                      1.20ms   832.58
// atomic_fast_map                                            511.35us    1.96K
// fast_map                                                   196.28us    5.09K
// ============================================================================

BENCHMARK(std_map) {
  std::unordered_map<long, long> m;
  m.reserve(10000);
  for (int i=0; i<10000; ++i) {
    m.emplace(i,i);
  }

  for (int i=0; i<10000; ++i) {
    auto a = m.find(i);
    folly::doNotOptimizeAway(&*a);
  }
}

BENCHMARK(atomic_fast_map) {
  UIM<long, long, uint32_t, std::atomic> m(10000);
  for (int i=0; i<10000; ++i) {
    m.emplace(i,i);
  }

  for (int i=0; i<10000; ++i) {
    auto a = m.find(i);
    folly::doNotOptimizeAway(&*a);
  }
}

BENCHMARK(fast_map) {
  UIM<long, long, uint32_t, non_atomic> m(10000);
  for (int i=0; i<10000; ++i) {
    m.emplace(i,i);
  }

  for (int i=0; i<10000; ++i) {
    auto a = m.find(i);
    folly::doNotOptimizeAway(&*a);
  }
}

BENCHMARK(atomic_fast_map_64) {
  UIM<long, long, uint64_t, std::atomic> m(10000);
  for (int i=0; i<10000; ++i) {
    m.emplace(i,i);
  }

  for (int i=0; i<10000; ++i) {
    auto a = m.find(i);
    folly::doNotOptimizeAway(&*a);
  }
}

BENCHMARK(fast_map_64) {
  UIM<long, long, uint64_t, non_atomic> m(10000);
  for (int i=0; i<10000; ++i) {
    m.emplace(i,i);
  }

  for (int i=0; i<10000; ++i) {
    auto a = m.find(i);
    folly::doNotOptimizeAway(&*a);
  }
}


int main(int argc, char ** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  int rv = RUN_ALL_TESTS();
  folly::runBenchmarksOnFlag();
  return rv;
}
