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

#include <folly/stats/BucketedTimeSeries.h>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/stats/BucketedTimeSeries-defs.h>

using folly::BenchmarkSuspender;
using folly::BucketedTimeSeries;
using std::chrono::seconds;

void addValue(
    unsigned int iters,
    seconds duration,
    size_t numBuckets,
    size_t callsPerSecond) {
  BenchmarkSuspender suspend;
  BucketedTimeSeries<int64_t> ts(numBuckets, duration);
  suspend.dismiss();

  seconds currentTime(1342000000);
  size_t timeCounter = 0;
  for (unsigned int n = 0; n < iters; ++n, ++timeCounter) {
    if (timeCounter >= callsPerSecond) {
      timeCounter = 0;
      ++currentTime;
    }
    ts.addValue(currentTime, n);
  }
}

BENCHMARK_NAMED_PARAM(addValue, AllTime_1perSec, seconds(0), 60, 1)
BENCHMARK_NAMED_PARAM(addValue, 3600x60_1perSec, seconds(3600), 60, 1)
BENCHMARK_NAMED_PARAM(addValue, 600x60_1perSec, seconds(600), 60, 1)
BENCHMARK_NAMED_PARAM(addValue, 60x60_1perSec, seconds(60), 60, 1)
BENCHMARK_NAMED_PARAM(addValue, 100x10_1perSec, seconds(100), 10, 1)
BENCHMARK_NAMED_PARAM(addValue, 71x5_1perSec, seconds(71), 5, 1)
BENCHMARK_NAMED_PARAM(addValue, 1x1_1perSec, seconds(1), 1, 1)

BENCHMARK_DRAW_LINE();

BENCHMARK_NAMED_PARAM(addValue, AllTime_10perSec, seconds(0), 60, 10)
BENCHMARK_NAMED_PARAM(addValue, 3600x60_10perSec, seconds(3600), 60, 10)
BENCHMARK_NAMED_PARAM(addValue, 600x60_10perSec, seconds(600), 60, 10)
BENCHMARK_NAMED_PARAM(addValue, 60x60_10perSec, seconds(60), 60, 10)
BENCHMARK_NAMED_PARAM(addValue, 100x10_10perSec, seconds(100), 10, 10)
BENCHMARK_NAMED_PARAM(addValue, 71x5_10perSec, seconds(71), 5, 10)
BENCHMARK_NAMED_PARAM(addValue, 1x1_10perSec, seconds(1), 1, 10)

BENCHMARK_DRAW_LINE();

BENCHMARK_NAMED_PARAM(addValue, AllTime_100perSec, seconds(0), 60, 100)
BENCHMARK_NAMED_PARAM(addValue, 3600x60_100perSec, seconds(3600), 60, 100)
BENCHMARK_NAMED_PARAM(addValue, 600x60_100perSec, seconds(600), 60, 100)
BENCHMARK_NAMED_PARAM(addValue, 60x60_100perSec, seconds(60), 60, 100)
BENCHMARK_NAMED_PARAM(addValue, 100x10_100perSec, seconds(100), 10, 100)
BENCHMARK_NAMED_PARAM(addValue, 71x5_100perSec, seconds(71), 5, 100)
BENCHMARK_NAMED_PARAM(addValue, 1x1_100perSec, seconds(1), 1, 100)

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
