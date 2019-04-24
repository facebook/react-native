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

#include <folly/GLog.h>

#include <folly/Benchmark.h>

BENCHMARK(skip_overhead, iter) {
  auto prev = FLAGS_minloglevel;
  FLAGS_minloglevel = 2;

  for (unsigned i = 0; i < iter; ++i) {
    FB_LOG_EVERY_MS(INFO, 1000) << "every 1s";
  }

  FLAGS_minloglevel = prev;
}

BENCHMARK(dev_null_log_overhead, iter) {
  auto prev = FLAGS_minloglevel;
  FLAGS_minloglevel = 2;

  for (unsigned i = 0; i < iter; ++i) {
    FB_LOG_EVERY_MS(INFO, -1) << "every -1ms";
  }

  FLAGS_minloglevel = prev;
}

// ============================================================================
// folly/test/GLogBenchmark.cpp                    relative  time/iter  iters/s
// ============================================================================
// skip_overhead                                               36.37ns   27.49M
// dev_null_log_overhead                                        2.61us  382.57K
// ============================================================================

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
