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
  PThreadGetSpecific() : key_(0) { pthread_key_create(&key_, OnThreadExit); }

  T* get() const { return static_cast<T*>(pthread_getspecific(key_)); }

  void reset(T* t) {
    delete get();
    pthread_setspecific(key_, t);
  }
  static void OnThreadExit(void* obj) { delete static_cast<T*>(obj); }

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
REG(tlp);
PThreadGetSpecific<int> pthread_get_specific;
REG(pthread_get_specific);
boost::thread_specific_ptr<int> boost_tsp;
REG(boost_tsp);
BENCHMARK_DRAW_LINE();

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  gflags::SetCommandLineOptionWithMode(
      "bm_max_iters", "100000000", gflags::SET_FLAG_IF_DEFAULT);
  folly::runBenchmarks();
  return 0;
}

/*
Ran with 24 threads on dual 12-core Xeon(R) X5650 @ 2.67GHz with 12-MB caches

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
*       BM_mt_tlp                   100000000  39.88 ms  398.8 ps  2.335 G
 +5.91% BM_mt_pthread_get_specific  100000000  42.23 ms  422.3 ps  2.205 G
 + 295% BM_mt_boost_tsp             100000000  157.8 ms  1.578 ns  604.5 M
------------------------------------------------------------------------------
*/
