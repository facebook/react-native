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

#include <folly/synchronization/CallOnce.h>

#include <deque>
#include <mutex>
#include <thread>

#include <folly/Benchmark.h>

#include <glog/logging.h>

DEFINE_int32(threads, 16, "benchmark concurrency");

template <typename CallOnceFunc>
void bm_impl(CallOnceFunc&& fn, size_t iters) {
  std::deque<std::thread> threads;
  for (size_t i = 0u; i < size_t(FLAGS_threads); ++i) {
    threads.emplace_back([&fn, iters] {
      for (size_t j = 0u; j < iters; ++j) {
        fn();
      }
    });
  }
  for (std::thread& t : threads) {
    t.join();
  }
}

BENCHMARK(StdCallOnceBench, iters) {
  std::once_flag flag;
  int out = 0;
  bm_impl([&] { std::call_once(flag, [&] { ++out; }); }, iters);
  CHECK_EQ(1, out);
}

BENCHMARK(FollyCallOnceBench, iters) {
  folly::once_flag flag;
  int out = 0;
  bm_impl([&] { folly::call_once(flag, [&] { ++out; }); }, iters);
  CHECK_EQ(1, out);
}

/*
$ call_once_benchmark --bm_min_iters=100000000 --threads=16
============================================================================
folly/synchronization/test/CallOnceBenchmark.cpprelative  time/iter  iters/s
============================================================================
StdCallOnceBench                                             2.40ns  416.78M
FollyCallOnceBench                                         651.94ps    1.53G
============================================================================
*/

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
