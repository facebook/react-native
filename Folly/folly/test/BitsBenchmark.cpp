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

// @author Tudor Bosman (tudorb@fb.com)

#include <folly/Bits.h>

#include <folly/Benchmark.h>

using namespace folly;

BENCHMARK(nextPowTwoClz, iters) {
  for (unsigned long i = 0; i < iters; ++i) {
    auto x = folly::nextPowTwo(iters);
    folly::doNotOptimizeAway(x);
  }
}

BENCHMARK_DRAW_LINE();
BENCHMARK(isPowTwo, iters) {
  bool b;
  for (unsigned long i = 0; i < iters; ++i) {
    b = folly::isPowTwo(i);
    folly::doNotOptimizeAway(b);
  }
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

/*
Benchmarks run on dual Xeon X5650's @ 2.67GHz w/hyperthreading enabled
  (12 physical cores, 12 MB cache, 72 GB RAM)

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
*       nextPowTwoClz                 1000000  1.659 ms  1.659 ns  574.8 M
*/
