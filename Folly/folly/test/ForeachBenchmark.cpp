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

#include <folly/Foreach.h>

#include <folly/Benchmark.h>
#include <folly/portability/GTest.h>

#include <map>

using namespace folly;
using namespace folly::detail;

// Benchmarks:
// 1. Benchmark iterating through the man with FOR_EACH, and also assign
//    iter->first and iter->second to local vars inside the FOR_EACH loop.
// 2. Benchmark iterating through the man with FOR_EACH, but use iter->first and
//    iter->second as is, without assigning to local variables.
// 3. Use FOR_EACH_KV loop to iterate through the map.

std::map<int, std::string> bmMap; // For use in benchmarks below.

void setupBenchmark(size_t iters) {
  bmMap.clear();
  for (size_t i = 0; i < iters; ++i) {
    bmMap[i] = "teststring";
  }
}

BENCHMARK(ForEachKVNoMacroAssign, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND { setupBenchmark(iters); }

  FOR_EACH(iter, bmMap) {
    const int k = iter->first;
    const std::string v = iter->second;
    sumKeys += k;
    sumValues += v;
  }
}

BENCHMARK(ForEachKVNoMacroNoAssign, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND { setupBenchmark(iters); }

  FOR_EACH(iter, bmMap) {
    sumKeys += iter->first;
    sumValues += iter->second;
  }
}

BENCHMARK(ManualLoopNoAssign, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND { setupBenchmark(iters); }

  for (auto iter = bmMap.begin(); iter != bmMap.end(); ++iter) {
    sumKeys += iter->first;
    sumValues += iter->second;
  }
}

BENCHMARK(ForEachKVMacro, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND { setupBenchmark(iters); }

  FOR_EACH_KV(k, v, bmMap) {
    sumKeys += k;
    sumValues += v;
  }
}

BENCHMARK(ForEachManual, iters) {
  int sum = 1;
  for (size_t i = 1; i < iters; ++i) {
    sum *= i;
  }
  doNotOptimizeAway(sum);
}

BENCHMARK(ForEachRange, iters) {
  int sum = 1;
  FOR_EACH_RANGE(i, 1, iters) { sum *= i; }
  doNotOptimizeAway(sum);
}

BENCHMARK(ForEachDescendingManual, iters) {
  int sum = 1;
  for (size_t i = iters; i-- > 1;) {
    sum *= i;
  }
  doNotOptimizeAway(sum);
}

BENCHMARK(ForEachRangeR, iters) {
  int sum = 1;
  FOR_EACH_RANGE_R(i, 1U, iters) { sum *= i; }
  doNotOptimizeAway(sum);
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  auto r = RUN_ALL_TESTS();
  if (r) {
    return r;
  }
  runBenchmarks();
  return 0;
}
