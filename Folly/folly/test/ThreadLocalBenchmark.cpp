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

#include <folly/ThreadLocal.h>

#include <sys/types.h>

#include <array>
#include <atomic>
#include <condition_variable>
#include <map>
#include <mutex>
#include <set>
#include <thread>

#include <boost/thread/tss.hpp>
#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GFlags.h>

using namespace folly;

// Simple reference implementation using pthread_get_specific
template <typename T>
class PThreadGetSpecific {
 public:
  PThreadGetSpecific() : key_(0) {
    pthread_key_create(&key_, OnThreadExit);
  }

  T* get() const {
    return static_cast<T*>(pthread_getspecific(key_));
  }

  void reset(T* t) {
    delete get();
    pthread_setspecific(key_, t);
  }
  static void OnThreadExit(void* obj) {
    delete static_cast<T*>(obj);
  }

 private:
  pthread_key_t key_;
};

DEFINE_int32(numThreads, 8, "Number simultaneous threads for benchmarks.");

#define REG(var)                                         \
  BENCHMARK(FB_CONCATENATE(BM_mt_, var), iters) {        \
    const int itersPerThread = iters / FLAGS_numThreads; \
    std::vector<std::thread> threads;                    \
    for (int i = 0; i < FLAGS_numThreads; ++i) {         \
      threads.push_back(std::thread([&]() {              \
        var.reset(new int(0));                           \
        for (int j = 0; j < itersPerThread; ++j) {       \
          ++(*var.get());                                \
        }                                                \
      }));                                               \
    }                                                    \
    for (auto& t : threads) {                            \
      t.join();                                          \
    }                                                    \
  }

ThreadLocalPtr<int> tlp;
REG(tlp)
PThreadGetSpecific<int> pthread_get_specific;
REG(pthread_get_specific)
boost::thread_specific_ptr<int> boost_tsp;
REG(boost_tsp)
BENCHMARK_DRAW_LINE();

struct foo {
  int a{0};
  int b{0};
};

template <typename TL>
void run_multi(uint32_t iters) {
  const int itersPerThread = iters / FLAGS_numThreads;
  std::vector<std::thread> threads;
  TL var;
  for (int i = 0; i < FLAGS_numThreads; ++i) {
    threads.push_back(std::thread([&]() {
      var.reset(new foo);
      for (int j = 0; j < itersPerThread; ++j) {
        ++var.get()->a;
        var.get()->b += var.get()->a;
        --var.get()->a;
        var.get()->b += var.get()->a;
      }
    }));
  }
  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK(BM_mt_tlp_multi, iters) {
  run_multi<ThreadLocalPtr<foo>>(iters);
}
BENCHMARK(BM_mt_pthread_get_specific_multi, iters) {
  run_multi<PThreadGetSpecific<foo>>(iters);
}
BENCHMARK(BM_mt_boost_tsp_multi, iters) {
  run_multi<boost::thread_specific_ptr<foo>>(iters);
}
BENCHMARK_DRAW_LINE();

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  gflags::SetCommandLineOptionWithMode(
      "bm_max_iters", "100000000", gflags::SET_FLAG_IF_DEFAULT);
  folly::runBenchmarks();
  return 0;
}

/*
./buck-out/gen/folly/test/thread_local_benchmark --bm_min_iters=10000000
--numThreads=1

============================================================================
folly/test/ThreadLocalBenchmark.cpp             relative  time/iter  iters/s
============================================================================
BM_mt_tlp                                                    1.92ns  520.02M
BM_mt_pthread_get_specific                                   2.69ns  372.15M
BM_mt_boost_tsp                                             11.81ns   84.67M
----------------------------------------------------------------------------
BM_mt_tlp_multi                                              7.53ns  132.79M
BM_mt_pthread_get_specific_multi                            15.80ns   63.29M
BM_mt_boost_tsp_multi                                       71.70ns   13.95M
----------------------------------------------------------------------------
============================================================================
*/
