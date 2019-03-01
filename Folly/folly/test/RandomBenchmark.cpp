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

#include <folly/Random.h>

#include <folly/Benchmark.h>
#include <folly/Foreach.h>

#include <glog/logging.h>

#include <thread>
#include <random>

using namespace folly;

BENCHMARK(minstdrand, n) {
  BenchmarkSuspender braces;
  std::random_device rd;
  std::minstd_rand rng(rd());

  braces.dismiss();

  FOR_EACH_RANGE(i, 0, n) { doNotOptimizeAway(rng()); }
}

BENCHMARK(mt19937, n) {
  BenchmarkSuspender braces;
  std::random_device rd;
  std::mt19937 rng(rd());

  braces.dismiss();

  FOR_EACH_RANGE(i, 0, n) { doNotOptimizeAway(rng()); }
}

BENCHMARK(threadprng, n) {
  BenchmarkSuspender braces;
  ThreadLocalPRNG tprng;
  tprng();

  braces.dismiss();

  FOR_EACH_RANGE(i, 0, n) { doNotOptimizeAway(tprng()); }
}

BENCHMARK(RandomDouble) { doNotOptimizeAway(Random::randDouble01()); }
BENCHMARK(Random32) { doNotOptimizeAway(Random::rand32()); }
BENCHMARK(Random32Num) { doNotOptimizeAway(Random::rand32(100)); }
BENCHMARK(Random64) { doNotOptimizeAway(Random::rand64()); }
BENCHMARK(Random64Num) { doNotOptimizeAway(Random::rand64(100ull << 32)); }
BENCHMARK(Random64OneIn) { doNotOptimizeAway(Random::oneIn(100)); }

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
