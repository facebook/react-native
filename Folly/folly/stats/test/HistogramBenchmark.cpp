/*
 * Copyright 2012-present Facebook, Inc.
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
#include <folly/stats/Histogram.h>

#include <folly/Benchmark.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GFlags.h>

using folly::Histogram;

void addValue(unsigned int n, int64_t bucketSize, int64_t min, int64_t max) {
  Histogram<int64_t> hist(bucketSize, min, max);
  int64_t num = min;
  FOR_EACH_RANGE (i, 0, n) {
    hist.addValue(num);
    ++num;
    if (num > max) {
      num = min;
    }
  }
}

BENCHMARK_NAMED_PARAM(addValue, 0_to_100, 1, 0, 100)
BENCHMARK_NAMED_PARAM(addValue, 0_to_1000, 10, 0, 1000)
BENCHMARK_NAMED_PARAM(addValue, 5k_to_20k, 250, 5000, 20000)

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
