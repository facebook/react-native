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
#pragma once

#include <folly/Benchmark.h>
#include <folly/experimental/hazptr/example/SWMRList.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

#include <atomic>
#include <thread>

namespace folly {
namespace hazptr {

template <typename InitFunc, typename Func, typename EndFunc>
inline uint64_t run_once(
    int nthreads,
    const InitFunc& init,
    const Func& fn,
    const EndFunc& endFn) {
  folly::BenchmarkSuspender susp;
  std::atomic<bool> start{false};
  std::atomic<int> started{0};

  init();

  std::vector<std::thread> threads(nthreads);
  for (int tid = 0; tid < nthreads; ++tid) {
    threads[tid] = std::thread([&, tid] {
      started.fetch_add(1);
      while (!start.load()) {
        /* spin */;
      }
      fn(tid);
    });
  }

  while (started.load() < nthreads) {
    /* spin */;
  }

  // begin time measurement
  auto tbegin = std::chrono::steady_clock::now();
  susp.dismiss();
  start.store(true);

  for (auto& t : threads) {
    t.join();
  }

  susp.rehire();
  // end time measurement
  auto tend = std::chrono::steady_clock::now();
  endFn();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
      .count();
}

template <typename RepFunc>
inline uint64_t bench(std::string name, int ops, const RepFunc& repFn) {
  int reps = 10;
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  repFn(); // sometimes first run is outlier
  for (int r = 0; r < reps; ++r) {
    uint64_t dur = repFn();
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }

  const std::string unit = " ns";
  uint64_t avg = sum / reps;
  uint64_t res = min;
  std::cout << name;
  std::cout << "   " << std::setw(4) << max / ops << unit;
  std::cout << "   " << std::setw(4) << avg / ops << unit;
  std::cout << "   " << std::setw(4) << res / ops << unit;
  std::cout << std::endl;
  return res;
}

const int ops = 1000000;

inline uint64_t listBench(std::string name, int nthreads, int size) {
  auto repFn = [&] {
    SWMRListSet<uint64_t> s;
    auto init = [&] {
      for (int i = 0; i < size; ++i) {
        s.add(i);
      }
    };
    auto fn = [&](int tid) {
      for (int j = tid; j < ops; j += nthreads) {
        s.contains(size);
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

inline uint64_t holderBench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < ops; j += nthreads) {
        hazptr_holder a[10];
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

template <size_t M>
inline uint64_t arrayBench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < 10 * ops; j += nthreads) {
        hazptr_array<M> a;
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

template <size_t M>
inline uint64_t localBench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < 10 * ops; j += nthreads) {
        hazptr_local<10> a;
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

inline uint64_t retireBench(std::string name, int nthreads) {
  struct Foo : hazptr_obj_base<Foo> {
    int x;
  };
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < ops; j += nthreads) {
        Foo* p = new Foo;
        p->retire();
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

const int nthr[] = {1, 10};
const int sizes[] = {10, 100};

inline void benches(std::string name) {
  std::cout << "------------------------------------------- " << name << "\n";
  for (int i : nthr) {
    std::cout << i << " threads -- 10x construct/destruct hazptr_holder"
              << std::endl;
    holderBench(name + "              ", i);
    holderBench(name + " - dup        ", i);
    std::cout << i << " threads -- 10x construct/destruct hazptr_array<10>"
              << std::endl;
    arrayBench<10>(name + "              ", i);
    arrayBench<10>(name + " - dup        ", i);
    std::cout << i << " threads -- 10x construct/destruct hazptr_array<3>"
              << std::endl;
    arrayBench<3>(name + "              ", i);
    arrayBench<3>(name + " - dup        ", i);
    std::cout << i << " threads -- 10x construct/destruct hazptr_local<10>"
              << std::endl;
    localBench<10>(name + "              ", i);
    localBench<10>(name + " - dup        ", i);
    std::cout << i << " threads -- 10x construct/destruct hazptr_local<1>"
              << std::endl;
    localBench<1>(name + "              ", i);
    localBench<1>(name + " - dup        ", i);
    std::cout << i << " threads -- allocate/retire/reclaim object" << std::endl;
    retireBench(name + "              ", i);
    retireBench(name + " - dup        ", i);
    for (int j : sizes) {
      std::cout << i << " threads -- " << j << "-item list" << std::endl;
      listBench(name + "              ", i, j);
      listBench(name + " - dup        ", i, j);
    }
  }
  std::cout << "----------------------------------------------------------\n";
}

} // namespace hazptr
} // namespace folly

/*
-------------------------------------------    amb -    tc
1 threads -- 10x construct/destruct hazptr_holder
   amb -    tc                   49 ns     46 ns     44 ns
   amb -    tc - dup             47 ns     45 ns     44 ns
1 threads -- 10x construct/destruct hazptr_array<10>
   amb -    tc                  132 ns    122 ns    117 ns
   amb -    tc - dup            130 ns    122 ns    117 ns
1 threads -- 10x construct/destruct hazptr_array<3>
   amb -    tc                   66 ns     64 ns     63 ns
   amb -    tc - dup             64 ns     64 ns     63 ns
1 threads -- 10x construct/destruct hazptr_local<10>
   amb -    tc                   29 ns     27 ns     27 ns
   amb -    tc - dup             28 ns     27 ns     27 ns
1 threads -- 10x construct/destruct hazptr_local<1>
   amb -    tc                   27 ns     27 ns     27 ns
   amb -    tc - dup             28 ns     28 ns     27 ns
1 threads -- allocate/retire/reclaim object
   amb -    tc                   65 ns     62 ns     60 ns
   amb -    tc - dup             65 ns     60 ns     59 ns
1 threads -- 10-item list
   amb -    tc                   21 ns     21 ns     20 ns
   amb -    tc - dup             22 ns     21 ns     21 ns
1 threads -- 100-item list
   amb -    tc                  229 ns    224 ns    220 ns
   amb -    tc - dup            223 ns    219 ns    216 ns
10 threads -- 10x construct/destruct hazptr_holder
   amb -    tc                    9 ns      8 ns      7 ns
   amb -    tc - dup              9 ns      8 ns      8 ns
10 threads -- 10x construct/destruct hazptr_array<10>
   amb -    tc                   27 ns     23 ns     15 ns
   amb -    tc - dup             26 ns     20 ns     13 ns
10 threads -- 10x construct/destruct hazptr_array<3>
   amb -    tc                   11 ns     11 ns      7 ns
   amb -    tc - dup             11 ns      9 ns      7 ns
10 threads -- 10x construct/destruct hazptr_local<10>
   amb -    tc                    5 ns      3 ns      3 ns
   amb -    tc - dup              3 ns      3 ns      3 ns
10 threads -- 10x construct/destruct hazptr_local<1>
   amb -    tc                    3 ns      3 ns      3 ns
   amb -    tc - dup              5 ns      4 ns      3 ns
10 threads -- allocate/retire/reclaim object
   amb -    tc                   17 ns     15 ns     14 ns
   amb -    tc - dup             17 ns     15 ns     14 ns
10 threads -- 10-item list
   amb -    tc                    4 ns      4 ns      2 ns
   amb -    tc - dup              4 ns      4 ns      3 ns
10 threads -- 100-item list
   amb -    tc                   33 ns     31 ns     24 ns
   amb -    tc - dup             33 ns     32 ns     30 ns
----------------------------------------------------------
------------------------------------------- no amb - no tc
1 threads -- construct/destruct 10 hazptr_holder-s
no amb - no tc                 2518 ns   2461 ns   2431 ns
no amb - no tc - dup           2499 ns   2460 ns   2420 ns
1 threads -- allocate/retire/reclaim object
no amb - no tc                   85 ns     83 ns     81 ns
no amb - no tc - dup             83 ns     82 ns     81 ns
1 threads -- 10-item list
no amb - no tc                  655 ns    644 ns    639 ns
no amb - no tc - dup            658 ns    645 ns    641 ns
1 threads -- 100-item list
no amb - no tc                 2175 ns   2142 ns   2124 ns
no amb - no tc - dup           2294 ns   2228 ns   2138 ns
10 threads -- construct/destruct 10 hazptr_holder-s
no amb - no tc                 3893 ns   2932 ns   1391 ns
no amb - no tc - dup           3157 ns   2927 ns   2726 ns
10 threads -- allocate/retire/reclaim object
no amb - no tc                  152 ns    134 ns    127 ns
no amb - no tc - dup            141 ns    133 ns    128 ns
10 threads -- 10-item list
no amb - no tc                  532 ns    328 ns    269 ns
no amb - no tc - dup            597 ns    393 ns    271 ns
10 threads -- 100-item list
no amb - no tc                  757 ns    573 ns    412 ns
no amb - no tc - dup            819 ns    643 ns    420 ns
----------------------------------------------------------
-------------------------------------------    amb - no tc
1 threads -- construct/destruct 10 hazptr_holder-s
   amb - no tc                 2590 ns   2481 ns   2422 ns
   amb - no tc - dup           2519 ns   2468 ns   2424 ns
1 threads -- allocate/retire/reclaim object
   amb - no tc                   69 ns     68 ns     67 ns
   amb - no tc - dup             69 ns     68 ns     67 ns
1 threads -- 10-item list
   amb - no tc                  524 ns    510 ns    492 ns
   amb - no tc - dup            514 ns    507 ns    496 ns
1 threads -- 100-item list
   amb - no tc                  761 ns    711 ns    693 ns
   amb - no tc - dup            717 ns    694 ns    684 ns
10 threads -- construct/destruct 10 hazptr_holder-s
   amb - no tc                 3302 ns   2908 ns   1612 ns
   amb - no tc - dup           3220 ns   2909 ns   1641 ns
10 threads -- allocate/retire/reclaim object
   amb - no tc                  129 ns    123 ns    110 ns
   amb - no tc - dup            135 ns    127 ns    120 ns
10 threads -- 10-item list
   amb - no tc                  512 ns    288 ns    256 ns
   amb - no tc - dup            275 ns    269 ns    263 ns
10 threads -- 100-item list
   amb - no tc                  297 ns    289 ns    284 ns
   amb - no tc - dup            551 ns    358 ns    282 ns
----------------------------------------------------------
------------------------------------------- no amb -    tc
1 threads -- construct/destruct 10 hazptr_holder-s
no amb -    tc                   56 ns     55 ns     55 ns
no amb -    tc - dup             56 ns     54 ns     54 ns
1 threads -- allocate/retire/reclaim object
no amb -    tc                   63 ns     62 ns     62 ns
no amb -    tc - dup             64 ns     63 ns     62 ns
1 threads -- 10-item list
no amb -    tc                  190 ns    188 ns    187 ns
no amb -    tc - dup            193 ns    186 ns    182 ns
1 threads -- 100-item list
no amb -    tc                 1859 ns   1698 ns   1666 ns
no amb -    tc - dup           1770 ns   1717 ns   1673 ns
10 threads -- construct/destruct 10 hazptr_holder-s
no amb -    tc                   19 ns     11 ns      7 ns
no amb -    tc - dup             11 ns      8 ns      7 ns
10 threads -- allocate/retire/reclaim object
no amb -    tc                    9 ns      8 ns      8 ns
no amb -    tc - dup             10 ns      9 ns      8 ns
10 threads -- 10-item list
no amb -    tc                   40 ns     25 ns     21 ns
no amb -    tc - dup             24 ns     23 ns     21 ns
10 threads -- 100-item list
no amb -    tc                  215 ns    208 ns    188 ns
no amb -    tc - dup            215 ns    209 ns    197 ns
----------------------------------------------------------
 */
