/*
 * Copyright 2013-present Facebook, Inc.
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

#include <stdexcept>
#include <thread>
#include <vector>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/experimental/exception_tracer/ExceptionTracer.h>
#include <folly/portability/GFlags.h>

void recurse(int level) {
  if (level == 0) {
    throw std::runtime_error("");
  }
  recurse(level - 1);
  folly::doNotOptimizeAway(0); // prevent tail recursion
}

void loop(int iters) {
  for (int i = 0; i < iters * 100; ++i) {
    try {
      recurse(100);
    } catch (const std::exception& e) {
      folly::exception_tracer::getCurrentExceptions();
    }
  }
}

BENCHMARK(ExceptionTracer, iters) {
  std::vector<std::thread> threads;
  constexpr size_t kNumThreads = 10;
  threads.resize(kNumThreads);
  for (auto& t : threads) {
    t = std::thread([iters]() { loop(iters); });
  }
  for (auto& t : threads) {
    t.join();
  }
}

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);
  folly::runBenchmarks();
  return 0;
}
