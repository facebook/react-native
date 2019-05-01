/*
 * Copyright 2014-present Facebook, Inc.
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

#include <atomic>
#include <memory>
#include <random>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/experimental/Bits.h>

std::random_device rd;

const size_t kBufferSize = 1 << 10;
std::vector<uint8_t> buffer(kBufferSize + 16);

template <class T>
void benchmarkSet(size_t n, T) {
  size_t size = sizeof(T) * 6.9; // use 6.9 bits/byte
  const size_t k = 16;
  T values[k];
  BENCHMARK_SUSPEND {
    std::mt19937 gen(rd());
    T max, min;
    if (std::is_signed<T>::value) {
      max = (T(1) << (size - 1)) - 1;
      min = -(T(1) << (size - 1));
    } else {
      max = (T(1) << size) - 1;
      min = 0;
    }
    CHECK_LE(folly::findLastSet(max), size);
    CHECK_LE(folly::findLastSet(-min), size);
    std::uniform_int_distribution<T> dis(min, max);
    for (size_t i = 0; i < k; ++i) {
      values[i] = dis(gen);
    }
  }

  for (size_t i = 0; i < n; ++i) {
    size_t bit = (i * 2973) % (kBufferSize * 8);
    size_t drop = i % size;
    folly::Bits<T>::set(
        reinterpret_cast<T*>(buffer.data()),
        bit,
        size - drop,
        values[i % k] >> drop);
  }

  folly::doNotOptimizeAway(
      folly::Bits<T>::test(reinterpret_cast<T*>(buffer.data()), 512));
}

BENCHMARK_NAMED_PARAM(benchmarkSet, u16, uint16_t())
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkSet, i16, int16_t())
BENCHMARK_NAMED_PARAM(benchmarkSet, u32, uint32_t())
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkSet, i32, int32_t())
BENCHMARK_NAMED_PARAM(benchmarkSet, u64, uint64_t())
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkSet, i64, int64_t())

BENCHMARK_DRAW_LINE();

std::atomic<int64_t> sum(0);

template <class T>
void benchmarkGet(size_t n, T x) {
  size_t size = sizeof(T) * 6.9; // use 6.9 bits/byte
  for (size_t i = 0; i < n; ++i) {
    size_t bit = (i * 2973) % (kBufferSize * 8);
    size_t drop = i % size;
    x += folly::Bits<T>::get(
        reinterpret_cast<T*>(buffer.data()), bit, size - drop);
  }
  folly::doNotOptimizeAway(x);
}

BENCHMARK_NAMED_PARAM(benchmarkGet, u16, uint16_t(0))
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkGet, i16, int16_t(0))
BENCHMARK_NAMED_PARAM(benchmarkGet, u32, uint32_t(0))
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkGet, i32, int32_t(0))
BENCHMARK_NAMED_PARAM(benchmarkGet, u64, uint64_t(0))
BENCHMARK_RELATIVE_NAMED_PARAM(benchmarkGet, i64, int64_t(0))

#if 0
============================================================================
folly/experimental/test/BitsBenchmark.cpp       relative  time/iter  iters/s
============================================================================
benchmarkSet(u16)                                            8.58ns  116.59M
benchmarkSet(i16)                                 88.42%     9.70ns  103.08M
benchmarkSet(u32)                                            8.37ns  119.45M
benchmarkSet(i32)                                 88.23%     9.49ns  105.39M
benchmarkSet(u64)                                            9.23ns  108.34M
benchmarkSet(i64)                                 82.77%    11.15ns   89.68M
----------------------------------------------------------------------------
benchmarkGet(u16)                                            6.32ns  158.13M
benchmarkGet(i16)                                 80.40%     7.87ns  127.14M
benchmarkGet(u32)                                            6.34ns  157.65M
benchmarkGet(i32)                                 84.61%     7.50ns  133.39M
benchmarkGet(u64)                                            7.32ns  136.58M
benchmarkGet(i64)                                 85.78%     8.53ns  117.16M
============================================================================
#endif

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return sum.load();
}
