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
// @author: Xin Liu <xliux@fb.com>

#include <map>
#include <memory>
#include <random>
#include <set>
#include <thread>

#include <folly/Benchmark.h>
#include <folly/ConcurrentSkipList.h>
#include <folly/hash/Hash.h>
#include <folly/portability/GFlags.h>
#include <folly/synchronization/RWSpinLock.h>
#include <glog/logging.h>

DEFINE_int32(num_threads, 12, "num concurrent threads to test");

// In some case, we may want to test worker threads operating on multiple
// lists. For example in search, not all threads are visiting the same posting
// list, but for the ones with some popular terms, they do get multiple
// visitors at the same time.
DEFINE_int32(num_sets, 1, "num of set to operate on");

static const int kInitHeadHeight = 10;
static const int kMaxValue = 0x1000000;

namespace {

using namespace folly;

typedef int ValueType;
typedef ConcurrentSkipList<ValueType> SkipListType;
typedef SkipListType::Accessor SkipListAccessor;
typedef std::set<ValueType> SetType;

static std::vector<ValueType> gData;
static void initData() {
  gData.resize(kMaxValue);
  for (int i = 0; i < kMaxValue; ++i) {
    gData[i] = i;
  }
  std::shuffle(gData.begin(), gData.end(), std::mt19937{});
}

// single thread benchmarks
void BM_IterateOverSet(int iters, int size) {
  SetType a_set;

  BENCHMARK_SUSPEND {
    CHECK_GT(size, 0);
    for (int i = 0; i < size; ++i) {
      a_set.insert(gData[rand() % kMaxValue]);
    }
  }

  int64_t sum = 0;
  auto iter = a_set.begin();
  for (int i = 0; i < iters; ++i) {
    sum += *iter++;
    if (iter == a_set.end()) {
      iter = a_set.begin();
    }
  }
  BENCHMARK_SUSPEND {
    // VLOG(20) << "sum = " << sum;
  }
}

void BM_IterateSkipList(int iters, int size) {
  BenchmarkSuspender susp;
  CHECK_GT(size, 0);
  auto skipList = SkipListType::create(kInitHeadHeight);
  for (int i = 0; i < size; ++i) {
    skipList.add(rand() % kMaxValue);
  }
  int64_t sum = 0;
  susp.dismiss();

  auto iter = skipList.begin();
  for (int i = 0; i < iters; ++i) {
    sum += *iter++;
    if (iter == skipList.end()) {
      iter = skipList.begin();
    }
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << "sum = " << sum;
  }
}

void BM_SetMerge(int iters, int size) {
  BenchmarkSuspender susp;
  SetType a_set;
  SetType b_set;
  for (int i = 0; i < iters; ++i) {
    a_set.insert(rand() % kMaxValue);
  }
  for (int i = 0; i < size; ++i) {
    b_set.insert(rand() % kMaxValue);
  }
  susp.dismiss();

  int64_t mergedSum = 0;
  FOR_EACH (it, a_set) {
    if (b_set.find(*it) != b_set.end()) {
      mergedSum += *it;
    }
  }
  BENCHMARK_SUSPEND {
    // VLOG(20) << mergedSum;
  }
}

void BM_CSLMergeLookup(int iters, int size) {
  BenchmarkSuspender susp;
  auto skipList = SkipListType::create(kInitHeadHeight);
  auto skipList2 = SkipListType::create(kInitHeadHeight);

  for (int i = 0; i < iters; ++i) {
    skipList.add(rand() % kMaxValue);
  }
  for (int i = 0; i < size; ++i) {
    skipList2.add(rand() % kMaxValue);
  }
  int64_t mergedSum = 0;
  susp.dismiss();

  SkipListType::Skipper skipper(skipList2);
  FOR_EACH (it, skipList) {
    if (skipper.to(*it)) {
      mergedSum += *it;
    }
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << mergedSum;
  }
}

// merge by two skippers
void BM_CSLMergeIntersection(int iters, int size) {
  BenchmarkSuspender susp;
  auto skipList = SkipListType::create(kInitHeadHeight);
  auto skipList2 = SkipListType::create(kInitHeadHeight);
  for (int i = 0; i < iters; ++i) {
    skipList.add(rand() % kMaxValue);
  }
  for (int i = 0; i < size; ++i) {
    skipList2.add(rand() % kMaxValue);
  }
  susp.dismiss();

  SkipListType::Skipper s1(skipList);
  SkipListType::Skipper s2(skipList2);

  int64_t mergedSum = 0;

  while (s1.good() && s2.good()) {
    int v1 = s1.data();
    int v2 = s2.data();
    if (v1 < v2) {
      s1.to(v2);
    } else if (v1 > v2) {
      s2.to(v1);
    } else {
      mergedSum += v1;
      ++s1;
      ++s2;
    }
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << mergedSum;
  }
}

void BM_SetContainsNotFound(int iters, int size) {
  BenchmarkSuspender susp;
  SetType aset;
  CHECK_LT(size, kMaxValue);
  for (int i = 0; i < size; ++i) {
    aset.insert(2 * i);
  }
  int64_t sum = 0;
  susp.dismiss();

  for (int i = 0; i < iters; ++i) {
    sum += (aset.end() == aset.find(2 * i + 1));
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << sum;
  }
}

void BM_SetContainsFound(int iters, int size) {
  BenchmarkSuspender susp;
  SetType aset;
  CHECK_LT(size, kMaxValue);

  for (int i = 0; i < size; ++i) {
    aset.insert(i);
  }

  std::vector<int> values;
  for (int i = 0; i < iters; ++i) {
    values.push_back(rand() % size);
  }
  int64_t sum = 0;
  susp.dismiss();

  for (int i = 0; i < iters; ++i) {
    sum += (aset.end() == aset.find(values[i]));
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << sum;
  }
}

void BM_CSLContainsFound(int iters, int size) {
  BenchmarkSuspender susp;
  auto skipList = SkipListType::create(kInitHeadHeight);
  CHECK_LT(size, kMaxValue);

  for (int i = 0; i < size; ++i) {
    skipList.add(i);
  }
  std::vector<int> values;
  for (int i = 0; i < iters; ++i) {
    values.push_back(rand() % size);
  }
  int64_t sum = 0;
  susp.dismiss();

  for (int i = 0; i < iters; ++i) {
    sum += skipList.contains(values[i]);
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << sum;
  }
}

void BM_CSLContainsNotFound(int iters, int size) {
  BenchmarkSuspender susp;
  auto skipList = SkipListType::create(kInitHeadHeight);
  CHECK_LT(size, kMaxValue);

  for (int i = 0; i < size; ++i) {
    skipList.add(2 * i);
  }
  int64_t sum = 0;
  susp.dismiss();

  for (int i = 0; i < iters; ++i) {
    sum += skipList.contains(2 * i + 1);
  }

  BENCHMARK_SUSPEND {
    // VLOG(20) << sum;
  }
}

void BM_AddSet(int iters, int size) {
  BenchmarkSuspender susp;
  SetType aset;
  for (int i = 0; i < size; ++i) {
    aset.insert(gData[i]);
  }
  susp.dismiss();

  for (int i = size; i < size + iters; ++i) {
    aset.insert(gData[i]);
  }
}

void BM_AddSkipList(int iters, int size) {
  BenchmarkSuspender susp;
  auto skipList = SkipListType::create(kInitHeadHeight);
  for (int i = 0; i < size; ++i) {
    skipList.add(gData[i]);
  }
  susp.dismiss();

  for (int i = size; i < size + iters; ++i) {
    skipList.add(gData[i]);
  }
}

BENCHMARK(Accessor, iters) {
  BenchmarkSuspender susp;
  auto skiplist = SkipListType::createInstance(kInitHeadHeight);
  auto sl = skiplist.get();

  susp.dismiss();
  for (size_t i = 0; i < iters; ++i) {
    SkipListAccessor accessor(sl);
  }
}

// a benchmark to estimate the
// low bound of doing a ref counting for an Accessor
BENCHMARK(accessorBasicRefcounting, iters) {
  BenchmarkSuspender susp;
  auto* value = new std::atomic<int32_t>();
  auto* dirty = new std::atomic<int32_t>();
  *value = *dirty = 0;
  folly::MicroSpinLock l;
  l.init();

  susp.dismiss();
  for (size_t i = 0; i < iters; ++i) {
    value->fetch_add(1, std::memory_order_relaxed);
    if (dirty->load(std::memory_order_acquire) != 0) {
      folly::MSLGuard g(l);
    }
    value->fetch_sub(1, std::memory_order_relaxed);
  }

  BENCHMARK_SUSPEND {
    delete dirty;
    delete value;
  }
}

// Data For testing contention benchmark
class ConcurrentAccessData {
 public:
  explicit ConcurrentAccessData(int size)
      : skipList_(SkipListType::create(10)),
        sets_(FLAGS_num_sets),
        locks_(FLAGS_num_sets) {
    for (int i = 0; i < size; ++i) {
      sets_[0].insert(i);
      skipList_.add(i);
    }

    for (int i = 0; i < FLAGS_num_sets; ++i) {
      locks_[i] = new RWSpinLock();
      if (i > 0) {
        sets_[i] = sets_[0];
      }
    }

// This requires knowledge of the C++ library internals. Only use it if we're
// using the GNU C++ library.
#ifdef _GLIBCXX_SYMVER
    // memory usage
    int64_t setMemorySize = sets_[0].size() * sizeof(*sets_[0].begin()._M_node);
    int64_t cslMemorySize = 0;
    for (auto it = skipList_.begin(); it != skipList_.end(); ++it) {
      cslMemorySize += it.nodeSize();
    }

    LOG(INFO) << "size=" << sets_[0].size()
              << "; std::set memory size=" << setMemorySize
              << "; csl memory size=" << cslMemorySize;
#endif

    readValues_.reserve(size);
    deleteValues_.reserve(size);
    writeValues_.reserve(size);
    for (int i = size; i < 2 * size; ++i) {
      readValues_.push_back(2 * i);
      deleteValues_.push_back(2 * i);

      // half new values and half already in the list
      writeValues_.push_back((rand() % 2) + 2 * i);
    }
    std::shuffle(readValues_.begin(), readValues_.end(), std::mt19937{});
    std::shuffle(deleteValues_.begin(), deleteValues_.end(), std::mt19937{});
    std::shuffle(writeValues_.begin(), writeValues_.end(), std::mt19937{});
  }

  ~ConcurrentAccessData() {
    FOR_EACH (lock, locks_)
      delete *lock;
  }

  inline bool skipListFind(int /* idx */, ValueType val) {
    return skipList_.contains(val);
  }
  inline void skipListInsert(int /* idx */, ValueType val) {
    skipList_.add(val);
  }
  inline void skipListErase(int /* idx */, ValueType val) {
    skipList_.remove(val);
  }

  inline bool setFind(int idx, ValueType val) {
    RWSpinLock::ReadHolder g(locks_[idx]);
    return sets_[idx].find(val) == sets_[idx].end();
  }
  inline void setInsert(int idx, ValueType val) {
    RWSpinLock::WriteHolder g(locks_[idx]);
    sets_[idx].insert(val);
  }
  inline void setErase(int idx, ValueType val) {
    RWSpinLock::WriteHolder g(locks_[idx]);
    sets_[idx].erase(val);
  }

  void runSkipList(int id, size_t iters) {
    int sum = 0;
    for (size_t i = 0; i < iters; ++i) {
      sum += accessSkipList(id, i);
    }
    // VLOG(20) << sum;
  }

  void runSet(size_t id, size_t iters) {
    int sum = 0;
    for (size_t i = 0; i < iters; ++i) {
      sum += accessSet(id, i);
    }
    // VLOG(20) << sum;
  }

  bool accessSkipList(int64_t id, size_t t) {
    if (t > readValues_.size()) {
      t = t % readValues_.size();
    }
    uint32_t h = folly::hash::twang_32from64(t * id);
    switch (h % 8) {
      case 7: // write
        if ((h & 0x31) == 0) { // 1/4 chance to delete
          skipListErase(0, deleteValues_[t]);
        } else {
          skipListInsert(0, writeValues_[t]);
        }
        return false;
      default:
        return skipListFind(0, readValues_[t]);
    }
  }

  bool accessSet(int64_t id, size_t t) {
    if (t > readValues_.size()) {
      t = t % readValues_.size();
    }
    uint32_t h = folly::hash::twang_32from64(t * id);
    int idx = (h % FLAGS_num_sets);
    switch (h % 8) { // 1/8 chance to write
      case 7: // write
        if ((h & 0x31) == 0) { // 1/32 chance to delete
          setErase(idx, deleteValues_[t]);
        } else {
          setInsert(idx, writeValues_[t]);
        }
        return false;
      default:
        return setFind(idx, readValues_[t]);
    }
  }

 private:
  SkipListType::Accessor skipList_;
  std::vector<SetType> sets_;
  std::vector<RWSpinLock*> locks_;

  std::vector<ValueType> readValues_;
  std::vector<ValueType> writeValues_;
  std::vector<ValueType> deleteValues_;
};

static std::map<int, std::shared_ptr<ConcurrentAccessData>> g_data;

static ConcurrentAccessData* mayInitTestData(int size) {
  auto it = g_data.find(size);
  if (it == g_data.end()) {
    auto ptr = std::make_shared<ConcurrentAccessData>(size);
    g_data[size] = ptr;
    return ptr.get();
  }
  return it->second.get();
}

void BM_ContentionCSL(int iters, int size) {
  BenchmarkSuspender susp;
  auto data = mayInitTestData(size);
  std::vector<std::thread> threads;
  susp.dismiss();

  for (int i = 0; i < FLAGS_num_threads; ++i) {
    threads.push_back(
        std::thread(&ConcurrentAccessData::runSkipList, data, i, iters));
  }
  FOR_EACH (t, threads) { (*t).join(); }
}

void BM_ContentionStdSet(int iters, int size) {
  BenchmarkSuspender susp;
  auto data = mayInitTestData(size);
  std::vector<std::thread> threads;
  susp.dismiss();

  for (int i = 0; i < FLAGS_num_threads; ++i) {
    threads.push_back(
        std::thread(&ConcurrentAccessData::runSet, data, i, iters));
  }
  FOR_EACH (t, threads) { (*t).join(); }
  susp.rehire();
}

// Single-thread benchmarking

BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_IterateOverSet, 1000)
BENCHMARK_PARAM(BM_IterateSkipList, 1000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_IterateOverSet, 1000000)
BENCHMARK_PARAM(BM_IterateSkipList, 1000000)
BENCHMARK_DRAW_LINE();

// find with keys in the set
BENCHMARK_PARAM(BM_SetContainsFound, 1000)
BENCHMARK_PARAM(BM_CSLContainsFound, 1000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_SetContainsFound, 100000)
BENCHMARK_PARAM(BM_CSLContainsFound, 100000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_SetContainsFound, 1000000)
BENCHMARK_PARAM(BM_CSLContainsFound, 1000000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_SetContainsFound, 10000000)
BENCHMARK_PARAM(BM_CSLContainsFound, 10000000)
BENCHMARK_DRAW_LINE();

// find with keys not in the set
BENCHMARK_PARAM(BM_SetContainsNotFound, 1000)
BENCHMARK_PARAM(BM_CSLContainsNotFound, 1000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_SetContainsNotFound, 100000)
BENCHMARK_PARAM(BM_CSLContainsNotFound, 100000)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(BM_SetContainsNotFound, 1000000)
BENCHMARK_PARAM(BM_CSLContainsNotFound, 1000000)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_AddSet, 1000)
BENCHMARK_PARAM(BM_AddSkipList, 1000)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_AddSet, 65536)
BENCHMARK_PARAM(BM_AddSkipList, 65536)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_AddSet, 1000000)
BENCHMARK_PARAM(BM_AddSkipList, 1000000)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_SetMerge, 1000)
BENCHMARK_PARAM(BM_CSLMergeIntersection, 1000)
BENCHMARK_PARAM(BM_CSLMergeLookup, 1000)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_SetMerge, 65536)
BENCHMARK_PARAM(BM_CSLMergeIntersection, 65536)
BENCHMARK_PARAM(BM_CSLMergeLookup, 65536)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_SetMerge, 1000000)
BENCHMARK_PARAM(BM_CSLMergeIntersection, 1000000)
BENCHMARK_PARAM(BM_CSLMergeLookup, 1000000)
BENCHMARK_DRAW_LINE();

// multithreaded benchmarking

BENCHMARK_PARAM(BM_ContentionStdSet, 1024)
BENCHMARK_PARAM(BM_ContentionCSL, 1024)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_ContentionStdSet, 65536)
BENCHMARK_PARAM(BM_ContentionCSL, 65536)
BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_ContentionStdSet, 1048576)
BENCHMARK_PARAM(BM_ContentionCSL, 1048576)
BENCHMARK_DRAW_LINE();

} // namespace

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  initData();
  runBenchmarks();
  return 0;
}

#if 0
/*
Benchmark on Intel(R) Xeon(R) CPU X5650 @2.67GHz

==============================================================================
1 thread Benchmark                     Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
 +37.0% BM_Accessor                    100000  1.958 ms  19.58 ns  48.71 M
*       BM_AccessorBasicRefcounting    100000  1.429 ms  14.29 ns  66.74 M
------------------------------------------------------------------------------
 + 603% BM_IterateOverSet/1000         100000  1.589 ms  15.89 ns  60.02 M
*       BM_IterateSkipList/1000        100000    226 us   2.26 ns    422 M
------------------------------------------------------------------------------
 + 107% BM_IterateOverSet/976.6k       100000  8.324 ms  83.24 ns  11.46 M
*       BM_IterateSkipList/976.6k      100000  4.016 ms  40.16 ns  23.75 M
------------------------------------------------------------------------------
*       BM_SetContainsFound/1000       100000  7.082 ms  70.82 ns  13.47 M
 +39.9% BM_CSLContainsFound/1000       100000  9.908 ms  99.08 ns  9.625 M
------------------------------------------------------------------------------
*       BM_SetContainsFound/97.66k     100000   23.8 ms    238 ns  4.006 M
 +5.97% BM_CSLContainsFound/97.66k     100000  25.23 ms  252.3 ns  3.781 M
------------------------------------------------------------------------------
 +33.6% BM_SetContainsFound/976.6k     100000   64.3 ms    643 ns  1.483 M
*       BM_CSLContainsFound/976.6k     100000  48.13 ms  481.3 ns  1.981 M
------------------------------------------------------------------------------
 +30.3% BM_SetContainsFound/9.537M     100000  115.1 ms  1.151 us  848.6 k
*       BM_CSLContainsFound/9.537M     100000  88.33 ms  883.3 ns   1.08 M
------------------------------------------------------------------------------
*       BM_SetContainsNotFound/1000    100000  2.081 ms  20.81 ns  45.83 M
 +76.2% BM_CSLContainsNotFound/1000    100000  3.667 ms  36.67 ns  26.01 M
------------------------------------------------------------------------------
*       BM_SetContainsNotFound/97.66k  100000  6.049 ms  60.49 ns  15.77 M
 +32.7% BM_CSLContainsNotFound/97.66k  100000  8.025 ms  80.25 ns  11.88 M
------------------------------------------------------------------------------
*       BM_SetContainsNotFound/976.6k  100000  7.464 ms  74.64 ns  12.78 M
 +12.8% BM_CSLContainsNotFound/976.6k  100000  8.417 ms  84.17 ns  11.33 M
------------------------------------------------------------------------------
*       BM_AddSet/1000                 100000  29.26 ms  292.6 ns  3.259 M
 +70.0% BM_AddSkipList/1000            100000  49.75 ms  497.5 ns  1.917 M
------------------------------------------------------------------------------
*       BM_AddSet/64k                  100000  38.73 ms  387.3 ns  2.462 M
 +55.7% BM_AddSkipList/64k             100000   60.3 ms    603 ns  1.581 M
------------------------------------------------------------------------------
*       BM_AddSet/976.6k               100000  75.71 ms  757.1 ns   1.26 M
 +33.6% BM_AddSkipList/976.6k          100000  101.2 ms  1.012 us  965.3 k
------------------------------------------------------------------------------
 + 716% BM_SetMerge/1000               100000  6.872 ms  68.72 ns  13.88 M
*       BM_CSLMergeIntersection/1000   100000    842 us   8.42 ns  113.3 M
 + 268% BM_CSLMergeLookup/1000         100000    3.1 ms     31 ns  30.76 M
------------------------------------------------------------------------------
 +36.3% BM_SetMerge/64k                100000  14.03 ms  140.3 ns  6.798 M
 +39.4% BM_CSLMergeIntersection/64k    100000  14.35 ms  143.5 ns  6.645 M
*       BM_CSLMergeLookup/64k          100000  10.29 ms  102.9 ns  9.266 M
------------------------------------------------------------------------------
 +10.3% BM_SetMerge/976.6k             100000  46.24 ms  462.4 ns  2.062 M
 +25.1% BM_CSLMergeIntersection/976.6k 100000  52.47 ms  524.7 ns  1.818 M
*       BM_CSLMergeLookup/976.6k       100000  41.94 ms  419.3 ns  2.274 M
------------------------------------------------------------------------------


==============================================================================
Contention benchmark 7/8 find, 3/32 insert, 1/32 erase

 4 threads Benchmark                   Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
 + 269% BM_ContentionStdSet/1k         100000  75.66 ms  756.6 ns   1.26 M
*       BM_ContentionCSL/1k            100000  20.47 ms  204.7 ns  4.658 M
------------------------------------------------------------------------------
 + 228% BM_ContentionStdSet/64k        100000  105.6 ms  1.056 us  924.9 k
*       BM_ContentionCSL/64k           100000  32.18 ms  321.8 ns  2.963 M
------------------------------------------------------------------------------
 + 224% BM_ContentionStdSet/1M         100000  117.4 ms  1.174 us  832.2 k
*       BM_ContentionCSL/1M            100000  36.18 ms  361.8 ns  2.636 M
------------------------------------------------------------------------------


12 threads Benchmark                   Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
 + 697% BM_ContentionStdSet/1k         100000  455.3 ms  4.553 us  214.5 k
*       BM_ContentionCSL/1k            100000  57.12 ms  571.2 ns   1.67 M
------------------------------------------------------------------------------
 +1257% BM_ContentionStdSet/64k        100000  654.9 ms  6.549 us  149.1 k
*       BM_ContentionCSL/64k           100000  48.24 ms  482.4 ns  1.977 M
------------------------------------------------------------------------------
 +1262% BM_ContentionStdSet/1M         100000  657.3 ms  6.573 us  148.6 k
*       BM_ContentionCSL/1M            100000  48.25 ms  482.5 ns  1.977 M
------------------------------------------------------------------------------

*/
#endif
