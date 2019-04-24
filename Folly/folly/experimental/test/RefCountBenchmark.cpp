/*
 * Copyright 2015-present Facebook, Inc.
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
#include <thread>

#include <folly/Benchmark.h>
#include <folly/experimental/TLRefCount.h>

namespace folly {

template <typename Counter>
void shutdown(Counter&) {}

void shutdown(TLRefCount& c) {
  c.useGlobal();
  --c;
}

template <typename Counter, size_t threadCount>
void benchmark(size_t n) {
  Counter x;

  std::vector<std::thread> ts;

  for (size_t t = 0; t < threadCount; ++t) {
    ts.emplace_back([&]() {
      for (size_t i = 0; i < n; ++i) {
        ++x;
      }
      for (size_t i = 0; i < n; ++i) {
        --x;
      }
    });
  }

  for (auto& t : ts) {
    t.join();
  }

  shutdown(x);
}

BENCHMARK(TLRefCountOneThread, n) {
  benchmark<TLRefCount, 1>(n);
}

BENCHMARK(TLRefCountFourThreads, n) {
  benchmark<TLRefCount, 4>(n);
}

} // namespace folly

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  gflags::SetCommandLineOptionWithMode(
      "bm_min_usec", "100000", gflags::SET_FLAG_IF_DEFAULT);

  folly::runBenchmarks();

  return 0;
}
