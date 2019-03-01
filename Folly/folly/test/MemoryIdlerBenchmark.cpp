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

#include <folly/detail/MemoryIdler.h>

#include <folly/Benchmark.h>

using namespace folly::detail;

BENCHMARK(releaseStack, iters) {
  for (size_t i = 0; i < iters; ++i) {
    MemoryIdler::unmapUnusedStack();
  }
}

BENCHMARK(releaseMallocTLS, iters) {
  for (size_t i = 0; i < iters; ++i) {
    MemoryIdler::flushLocalMallocCaches();
  }
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
