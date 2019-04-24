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

#include <algorithm>
#include <map>

#include <folly/Benchmark.h>
#include <folly/Random.h>
#include <folly/container/Enumerate.h>
#include <folly/container/Foreach.h>
#include <folly/init/Init.h>

using namespace folly;
using namespace folly::detail;

// Benchmarks:
// 1. Benchmark iterating through the man with FOR_EACH, and also assign
//    iter->first and iter->second to local vars inside the FOR_EACH loop.
// 2. Benchmark iterating through the man with FOR_EACH, but use iter->first and
//    iter->second as is, without assigning to local variables.
// 3. Use FOR_EACH_KV loop to iterate through the map.

// For use in benchmarks below.
std::map<int, std::string> bmMap;
std::vector<int> vec_one;
std::vector<int> vec_two;

// Smallest type to isolate iteration overhead.
std::vector<char> vec_char;

void setupBenchmark(size_t iters) {
  bmMap.clear();
  for (size_t i = 0; i < iters; ++i) {
    bmMap[i] = "teststring";
  }

  vec_one.clear();
  vec_two.clear();
  vec_one.resize(iters);
  vec_two.resize(iters);
}

void setupCharVecBenchmark(size_t iters) {
  vec_char.resize(iters);
  std::generate(
      vec_char.begin(), vec_char.end(), [] { return Random::rand32(128); });
}

BENCHMARK(ForEachFunctionNoAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    folly::for_each(bmMap, [&](auto& key_val_pair) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
    });
    doNotOptimizeAway(sumKeys);
  });
}

BENCHMARK(StdForEachFunctionNoAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    std::for_each(bmMap.begin(), bmMap.end(), [&](auto& key_val_pair) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
    });
    doNotOptimizeAway(sumKeys);
  });
}

BENCHMARK(RangeBasedForLoopNoAssign, iters) {
  BenchmarkSuspender suspender;
  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    for (auto& key_val_pair : bmMap) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
    }
    doNotOptimizeAway(sumKeys);
  });
}

BENCHMARK(ManualLoopNoAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    for (auto iter = bmMap.begin(); iter != bmMap.end(); ++iter) {
      sumKeys += iter->first;
      sumValues += iter->second;
    }
    doNotOptimizeAway(sumKeys);
  });
}

BENCHMARK(ForEachFunctionAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    folly::for_each(bmMap, [&](auto& key_val_pair) {
      const int k = key_val_pair.first;
      const std::string v = key_val_pair.second;
      sumKeys += k;
      sumValues += v;
    });
  });
}

BENCHMARK(StdForEachFunctionAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    std::for_each(bmMap.begin(), bmMap.end(), [&](auto& key_val_pair) {
      const int k = key_val_pair.first;
      const std::string v = key_val_pair.second;
      sumKeys += k;
      sumValues += v;
    });
  });
}

BENCHMARK(RangeBasedForLoopAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    for (auto& key_val_pair : bmMap) {
      const int k = key_val_pair.first;
      const std::string v = key_val_pair.second;
      sumKeys += k;
      sumValues += v;
    }
  });
}

BENCHMARK(ManualLoopAssign, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    for (auto iter = bmMap.begin(); iter != bmMap.end(); ++iter) {
      const int k = iter->first;
      const std::string v = iter->second;
      sumKeys += k;
      sumValues += v;
    }
  });
}

BENCHMARK(ForEachFunctionNoAssignWithIndexManipulation, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    folly::for_each(bmMap, [&](auto& key_val_pair, auto index) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
      sumValues += index;
    });
  });
}

BENCHMARK(StdForEachFunctionNoAssignWithIndexManipulation, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    auto index = std::size_t{0};
    std::for_each(bmMap.begin(), bmMap.end(), [&](auto& key_val_pair) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
      sumValues += index;
      ++index;
    });
  });
}

BENCHMARK(RangeBasedForLoopNoAssignWithIndexManipulation, iters) {
  BenchmarkSuspender suspender;

  int sumKeys = 0;
  std::string sumValues;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    auto index = std::size_t{0};
    for (auto& key_val_pair : bmMap) {
      sumKeys += key_val_pair.first;
      sumValues += key_val_pair.second;
      sumValues += index;
    }
  });
}

BENCHMARK(ForEachFunctionFetch, iters) {
  BenchmarkSuspender suspender;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    folly::for_each(bmMap, [&](auto& key_val_pair, auto index) {
      folly::fetch(vec_one, index) = key_val_pair.first;
    });
  });
}

BENCHMARK(StdForEachFunctionFetch, iters) {
  BenchmarkSuspender suspender;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    auto index = std::size_t{0};
    std::for_each(bmMap.begin(), bmMap.end(), [&](auto& key_val_pair) {
      *(vec_one.begin() + index++) = key_val_pair.first;
    });
  });
}

BENCHMARK(ForLoopFetch, iters) {
  BenchmarkSuspender suspender;
  setupBenchmark(iters);

  suspender.dismissing([&]() {
    auto index = std::size_t{0};
    for (auto& key_val_pair : bmMap) {
      *(vec_one.begin() + index++) = key_val_pair.first;
    }
  });
}

BENCHMARK(ForEachKVNoMacroAssign, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND {
    setupBenchmark(iters);
  }

  FOR_EACH (iter, bmMap) {
    const int k = iter->first;
    const std::string v = iter->second;
    sumKeys += k;
    sumValues += v;
  }
}

BENCHMARK(ForEachKVNoMacroNoAssign, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND {
    setupBenchmark(iters);
  }

  FOR_EACH (iter, bmMap) {
    sumKeys += iter->first;
    sumValues += iter->second;
  }
}

BENCHMARK(ForEachKVMacro, iters) {
  int sumKeys = 0;
  std::string sumValues;

  BENCHMARK_SUSPEND {
    setupBenchmark(iters);
  }

  FOR_EACH_KV (k, v, bmMap) {
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
  FOR_EACH_RANGE (i, 1, iters) { sum *= i; }
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
  FOR_EACH_RANGE_R (i, 1U, iters) { sum *= i; }
  doNotOptimizeAway(sum);
}

BENCHMARK(CharVecForRange, iters) {
  BENCHMARK_SUSPEND {
    setupCharVecBenchmark(iters);
  }
  size_t sum = 0;
  for (auto& c : vec_char) {
    sum += c;
  }
  doNotOptimizeAway(sum);
}

BENCHMARK(CharVecForRangeExplicitIndex, iters) {
  BENCHMARK_SUSPEND {
    setupCharVecBenchmark(iters);
  }
  size_t sum = 0;
  size_t index = 0;
  for (auto& c : vec_char) {
    sum += c * index;
    ++index;
  }
  doNotOptimizeAway(sum);
}

BENCHMARK(CharVecForEach, iters) {
  BENCHMARK_SUSPEND {
    setupCharVecBenchmark(iters);
  }
  size_t sum = 0;
  folly::for_each(vec_char, [&](auto& c) { sum += c; });
  doNotOptimizeAway(sum);
}

BENCHMARK(CharVecForEachIndex, iters) {
  BENCHMARK_SUSPEND {
    setupCharVecBenchmark(iters);
  }
  size_t sum = 0;
  folly::for_each(vec_char, [&](auto& c, auto index) { sum += c * index; });
  doNotOptimizeAway(sum);
}

BENCHMARK(CharVecForRangeEnumerate, iters) {
  BENCHMARK_SUSPEND {
    setupCharVecBenchmark(iters);
  }
  size_t sum = 0;
  for (auto&& it : enumerate(vec_char)) {
    sum += *it * it.index;
  }
  doNotOptimizeAway(sum);
}

int main(int argc, char** argv) {
  folly::init(&argc, &argv);
  runBenchmarks();
  return 0;
}
