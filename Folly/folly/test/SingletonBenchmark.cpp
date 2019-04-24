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
/* -*- Mode: C++; tab-width: 2; c-basic-offset: 2; indent-tabs-mode: nil -*- */

#include <folly/Singleton.h>

#include <iostream>
#include <thread>

#include <folly/Benchmark.h>
#include <folly/Memory.h>
#include <folly/portability/GFlags.h>

FOLLY_GNU_DISABLE_WARNING("-Wdeprecated-declarations")

using namespace folly;

// Benchmarking a normal singleton vs a Meyers singleton vs a Folly
// singleton.  Meyers are insanely fast, but (hopefully) Folly
// singletons are fast "enough."
int* getMeyersSingleton() {
  static auto ret = new int(0);
  return ret;
}

int normal_singleton_value = 0;
int* getNormalSingleton() {
  doNotOptimizeAway(&normal_singleton_value);
  return &normal_singleton_value;
}

struct BenchmarkSingleton {
  int val = 0;
};

void run4Threads(std::function<void()> f) {
  std::vector<std::thread> threads;
  for (size_t i = 0; i < 4; ++i) {
    threads.emplace_back(f);
  }
  for (auto& thread : threads) {
    thread.join();
  }
}

void normalSingleton(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(getNormalSingleton());
  }
}

BENCHMARK(NormalSingleton, n) {
  normalSingleton(n);
}

BENCHMARK(NormalSingleton4Threads, n) {
  run4Threads([=]() { normalSingleton(n); });
}

void meyersSingleton(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(getMeyersSingleton());
  }
}

BENCHMARK(MeyersSingleton, n) {
  meyersSingleton(n);
}

BENCHMARK(MeyersSingleton4Threads, n) {
  run4Threads([=]() { meyersSingleton(n); });
}

struct BenchmarkTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonBenchmark = Singleton<T, Tag, BenchmarkTag>;

struct GetTag {};
struct TryGetTag {};
struct TryGetFastTag {};

SingletonBenchmark<BenchmarkSingleton, GetTag> benchmark_singleton_get;
SingletonBenchmark<BenchmarkSingleton, TryGetTag> benchmark_singleton_try_get;
SingletonBenchmark<BenchmarkSingleton, TryGetFastTag>
    benchmark_singleton_try_get_fast;

void follySingletonRaw(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    SingletonBenchmark<BenchmarkSingleton, GetTag>::get();
  }
}

BENCHMARK(FollySingletonRaw, n) {
  follySingletonRaw(n);
}

BENCHMARK(FollySingletonRaw4Threads, n) {
  run4Threads([=]() { follySingletonRaw(n); });
}

void follySingletonTryGet(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    SingletonBenchmark<BenchmarkSingleton, TryGetTag>::try_get();
  }
}

BENCHMARK(FollySingletonTryGet, n) {
  follySingletonTryGet(n);
}

BENCHMARK(FollySingletonTryGet4Threads, n) {
  run4Threads([=]() { follySingletonTryGet(n); });
}

void follySingletonTryGetFast(size_t n) {
  for (size_t i = 0; i < n; ++i) {
    SingletonBenchmark<BenchmarkSingleton, TryGetFastTag>::try_get_fast();
  }
}

BENCHMARK(FollySingletonTryGetFast, n) {
  follySingletonTryGetFast(n);
}

BENCHMARK(FollySingletonTryGetFast4Threads, n) {
  run4Threads([=]() { follySingletonTryGetFast(n); });
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  gflags::SetCommandLineOptionWithMode(
      "bm_min_usec", "100000", gflags::SET_FLAG_IF_DEFAULT);

  folly::runBenchmarks();

  return 0;
}
