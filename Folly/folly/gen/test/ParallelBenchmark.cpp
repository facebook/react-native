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

#include <array>
#include <future>
#include <iostream>
#include <vector>

#include <glog/logging.h>

#include <folly/gen/Base.h>
#include <folly/gen/Parallel.h>
#include <folly/gen/test/Bench.h>

DEFINE_int32(
    threads,
    std::max(1, (int32_t)sysconf(_SC_NPROCESSORS_CONF) / 2),
    "Num threads.");

using namespace folly::gen;
using std::vector;

constexpr int kFib = 28; // unit of work
size_t fib(int n) {
  return n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
}

static auto isPrimeSlow = [](int n) {
  if (n < 2) {
    return false;
  } else if (n > 2) {
    for (int d = 3; d * d <= n; d += 2) {
      if (0 == n % d) {
        return false;
      }
    }
  }
  return true;
};

static auto primes = seq(1, 1 << 20) | filter(isPrimeSlow) | as<vector>();

static auto stopc(int n) {
  return [=](int d) { return d * d > n; };
}
static auto divides(int n) {
  return [=](int d) { return 0 == n % d; };
}

static auto isPrime = [](int n) {
  return from(primes) | until(stopc(n)) | filter(divides(n)) | isEmpty;
};

static auto factors = [](int n) {
  return from(primes) | until(stopc(n)) | filter(divides(n)) | count;
};

static auto factorsSlow = [](int n) {
  return from(primes) | filter(divides(n)) | count;
};

static auto sleepyWork = [](int i) {
  const auto sleepyTime = std::chrono::microseconds(100);
  std::this_thread::sleep_for(sleepyTime);
  return i;
};

static auto sleepAndWork = [](int i) { return factorsSlow(i) + sleepyWork(i); };

auto start = 1 << 20;
auto v = seq(start) | take(1 << 20) | as<vector>();
auto small = from(v) | take(1 << 12);
auto medium = from(v) | take(1 << 14);
auto large = from(v) | take(1 << 18);
auto huge = from(v);
auto chunks = chunked(v);

BENCH_GEN(small | map(factorsSlow) | sum);
BENCH_GEN_REL(small | parallel(map(factorsSlow)) | sum);
BENCHMARK_DRAW_LINE();

BENCH_GEN(small | map(factors) | sum);
BENCH_GEN_REL(small | parallel(map(factors)) | sum);
BENCHMARK_DRAW_LINE();

BENCH_GEN(large | map(factors) | sum);
BENCH_GEN_REL(large | parallel(map(factors)) | sum);
BENCHMARK_DRAW_LINE();

auto ch = chunks;
auto cat = concat;
BENCH_GEN(huge | filter(isPrime) | count);
BENCH_GEN_REL(ch | cat | filter(isPrime) | count);
BENCH_GEN_REL(ch | parallel(cat | filter(isPrime)) | count);
BENCH_GEN_REL(ch | parallel(cat | filter(isPrime) | sub(count)) | sum);
BENCHMARK_DRAW_LINE();

BENCH_GEN(small | map(sleepAndWork) | sum);
BENCH_GEN_REL(small | parallel(map(sleepAndWork)) | sum);
BENCHMARK_DRAW_LINE();

const int fibs = 1000;
BENCH_GEN(seq(1, fibs) | map([](int) { return fib(kFib); }) | sum);
// clang-format off
BENCH_GEN_REL(
    seq(1, fibs)
      | parallel(map([](int) { return fib(kFib); }) | sub(sum))
      | sum);
// clang-format on
BENCH_GEN_REL([] {
  // clang-format off
  auto threads = seq(1, int(FLAGS_threads))
      | map([](int i) {
        return std::thread([=] {
          return range(
              (i + 0) * fibs / FLAGS_threads, (i + 1) * fibs / FLAGS_threads)
              | map([](int) { return fib(kFib); })
              | sum;
        });
      })
      | as<vector>();
  from(threads) | [](std::thread &thread) { thread.join(); };
  // clang-format on
  return 1;
}());
BENCHMARK_DRAW_LINE();

#if 0
============================================================================
folly/gen/test/ParallelBenchmark.cpp            relative  time/iter  iters/s
============================================================================
small | map(factorsSlow) | sum                                4.59s  217.87m
small | parallel(map(factorsSlow)) | sum        1588.86%   288.88ms     3.46
----------------------------------------------------------------------------
small | map(factors) | sum                                   9.62ms   103.94
small | parallel(map(factors)) | sum              89.15%    10.79ms    92.66
----------------------------------------------------------------------------
large | map(factors) | sum                                 650.52ms     1.54
large | parallel(map(factors)) | sum              53.82%      1.21s  827.41m
----------------------------------------------------------------------------
huge | filter(isPrime) | count                             295.93ms     3.38
ch | cat | filter(isPrime) | count                99.76%   296.64ms     3.37
ch | parallel(cat | filter(isPrime)) | count     142.75%   207.31ms     4.82
ch | parallel(cat | filter(isPrime) | sub(count 1538.50%    19.24ms    51.99
----------------------------------------------------------------------------
small | map(sleepAndWork) | sum                               5.37s  186.18m
small | parallel(map(sleepAndWork)) | sum       1840.38%   291.85ms     3.43
----------------------------------------------------------------------------
seq(1, fibs) | map([](int) { return fib(kFib);                1.49s  669.53m
seq(1, fibs) | parallel(map([](int) { return fi 1698.07%    87.96ms    11.37
[] { auto threads = seq(1, int(FLAGS_threads))  1571.16%    95.06ms    10.52
----------------------------------------------------------------------------
============================================================================
#endif
int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
