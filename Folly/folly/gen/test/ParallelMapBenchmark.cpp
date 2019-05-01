/*
 * Copyright 2014-present Facebook, Inc.
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

#include <algorithm>
#include <atomic>
#include <thread>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/gen/Base.h>
#include <folly/gen/ParallelMap.h>
#include <folly/portability/Unistd.h>

using namespace folly::gen;

DEFINE_int32(
    threads,
    std::max(1, (int32_t)sysconf(_SC_NPROCESSORS_CONF) / 2),
    "Num threads.");

constexpr int kFib = 35; // unit of work
size_t fib(int n) {
  return n <= 1 ? 1 : fib(n - 1) * fib(n - 2);
}

BENCHMARK(FibSumMap, n) {
  auto result = seq(1, (int)n) | map([](int) { return fib(kFib); }) | sum;
  folly::doNotOptimizeAway(result);
}

BENCHMARK_RELATIVE(FibSumPmap, n) {
  // Schedule more work: enough so that each worker thread does the
  // same amount as one FibSumMap.
  const size_t kNumThreads = FLAGS_threads;
  // clang-format off
  auto result =
    seq(1, (int)(n * kNumThreads))
    | pmap([](int) { return fib(kFib); }, kNumThreads)
    | sum;
  // clang-format on
  folly::doNotOptimizeAway(result);
}

BENCHMARK_RELATIVE(FibSumThreads, n) {
  // Schedule kNumThreads to execute the same code as FibSumMap.
  const size_t kNumThreads = FLAGS_threads;
  std::vector<std::thread> workers;
  workers.reserve(kNumThreads);
  auto fn = [n] {
    auto result = seq(1, (int)n) | map([](int) { return fib(kFib); }) | sum;
    folly::doNotOptimizeAway(result);
  };
  for (size_t i = 0; i < kNumThreads; i++) {
    workers.push_back(std::thread(fn));
  }
  for (auto& w : workers) {
    w.join();
  }
}

/*
  ============================================================================
  folly/gen/test/ParallelMapBenchmark.cpp         relative  time/iter  iters/s
  ============================================================================
  FibSumMap                                                   41.64ms    24.02
  FibSumPmap                                        98.38%    42.32ms    23.63
  FibSumThreads                                     94.48%    44.07ms    22.69
  ============================================================================

  real0m15.595s
  user2m47.100s
  sys0m0.016s
*/

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
