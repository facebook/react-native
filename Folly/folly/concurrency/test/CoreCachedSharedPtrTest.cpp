/*
 * Copyright 2017-present Facebook, Inc.
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

// AtomicSharedPtr-detail.h only works with libstdc++, so skip these tests for
// other vendors
#ifdef FOLLY_USE_LIBSTDCPP

#include <memory>
#include <thread>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/Portability.h>
#include <folly/concurrency/CoreCachedSharedPtr.h>
#include <folly/portability/GTest.h>

TEST(CoreCachedSharedPtr, Basic) {
  auto p = std::make_shared<int>(1);
  std::weak_ptr<int> wp(p);

  folly::CoreCachedSharedPtr<int> cached(p);
  folly::CoreCachedWeakPtr<int> wcached(cached);

  std::shared_ptr<int> p2 = cached.get();
  std::weak_ptr<int> wp2 = wcached.get();
  ASSERT_TRUE(p2 != nullptr);
  ASSERT_EQ(*p2, 1);
  ASSERT_FALSE(wp2.expired());

  p.reset();
  cached.reset();
  // p2 should survive.
  ASSERT_FALSE(wp.expired());
  // Here we don't know anything about wp2: could be expired even if
  // there is a living reference to the main object.

  p2.reset();
  ASSERT_TRUE(wp.expired());
  ASSERT_TRUE(wp2.expired());
}

namespace {

template <class Operation>
void parallelRun(Operation op, size_t numThreads, size_t iters) {
  std::vector<std::thread> threads;

  // Prevent the compiler from hoisting code out of the loop.
  auto opNoinline = [&]() FOLLY_NOINLINE { op(); };

  for (size_t t = 0; t < numThreads; ++t) {
    threads.emplace_back([&] {
      for (size_t i = 0; i < iters; ++i) {
        opNoinline();
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }
}

void benchmarkSharedPtrCopy(size_t numThreads, size_t iters) {
  auto p = std::make_shared<int>(1);
  parallelRun([&] { return p; }, numThreads, iters);
}

void benchmarkWeakPtrLock(size_t numThreads, size_t iters) {
  auto p = std::make_shared<int>(1);
  std::weak_ptr<int> wp = p;
  parallelRun([&] { return wp.lock(); }, numThreads, iters);
}

void benchmarkAtomicSharedPtrCopy(size_t numThreads, size_t iters) {
  auto s = std::make_shared<int>(1);
  folly::atomic_shared_ptr<int> p;
  p.store(s);
  parallelRun([&] { return p.load(); }, numThreads, iters);
}

void benchmarkCoreCachedSharedPtrGet(size_t numThreads, size_t iters) {
  folly::CoreCachedSharedPtr<int> p(std::make_shared<int>(1));
  parallelRun([&] { return p.get(); }, numThreads, iters);
}

void benchmarkCoreCachedWeakPtrLock(size_t numThreads, size_t iters) {
  folly::CoreCachedSharedPtr<int> p(std::make_shared<int>(1));
  folly::CoreCachedWeakPtr<int> wp(p);
  parallelRun([&] { return wp.get().lock(); }, numThreads, iters);
}

void benchmarkAtomicCoreCachedSharedPtrGet(size_t numThreads, size_t iters) {
  folly::AtomicCoreCachedSharedPtr<int> p(std::make_shared<int>(1));
  parallelRun([&] { return p.get(); }, numThreads, iters);
}

} // namespace

BENCHMARK(SharedPtrSingleThread, n) {
  benchmarkSharedPtrCopy(1, n);
}
BENCHMARK(WeakPtrSingleThread, n) {
  benchmarkWeakPtrLock(1, n);
}
BENCHMARK(AtomicSharedPtrSingleThread, n) {
  benchmarkAtomicSharedPtrCopy(1, n);
}
BENCHMARK(CoreCachedSharedPtrSingleThread, n) {
  benchmarkCoreCachedSharedPtrGet(1, n);
}
BENCHMARK(CoreCachedWeakPtrSingleThread, n) {
  benchmarkCoreCachedWeakPtrLock(1, n);
}
BENCHMARK(AtomicCoreCachedSharedPtrSingleThread, n) {
  benchmarkAtomicCoreCachedSharedPtrGet(1, n);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SharedPtr4Threads, n) {
  benchmarkSharedPtrCopy(4, n);
}
BENCHMARK(WeakPtr4Threads, n) {
  benchmarkWeakPtrLock(4, n);
}
BENCHMARK(AtomicSharedPtr4Threads, n) {
  benchmarkAtomicSharedPtrCopy(4, n);
}
BENCHMARK(CoreCachedSharedPtr4Threads, n) {
  benchmarkCoreCachedSharedPtrGet(4, n);
}
BENCHMARK(CoreCachedWeakPtr4Threads, n) {
  benchmarkCoreCachedWeakPtrLock(4, n);
}
BENCHMARK(AtomicCoreCachedSharedPtr4Threads, n) {
  benchmarkAtomicCoreCachedSharedPtrGet(4, n);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SharedPtr16Threads, n) {
  benchmarkSharedPtrCopy(16, n);
}
BENCHMARK(WeakPtr16Threads, n) {
  benchmarkWeakPtrLock(16, n);
}
BENCHMARK(AtomicSharedPtr16Threads, n) {
  benchmarkAtomicSharedPtrCopy(16, n);
}
BENCHMARK(CoreCachedSharedPtr16Threads, n) {
  benchmarkCoreCachedSharedPtrGet(16, n);
}
BENCHMARK(CoreCachedWeakPtr16Threads, n) {
  benchmarkCoreCachedWeakPtrLock(16, n);
}
BENCHMARK(AtomicCoreCachedSharedPtr16Threads, n) {
  benchmarkAtomicCoreCachedSharedPtrGet(16, n);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SharedPtrSingleThreadReset, n) {
  auto p = std::make_shared<int>(1);
  parallelRun([&] { p = std::make_shared<int>(1); }, 1, n);
}
BENCHMARK(AtomicSharedPtrSingleThreadReset, n) {
  auto s = std::make_shared<int>(1);
  folly::atomic_shared_ptr<int> p;
  p.store(s);
  parallelRun([&] { p.store(std::make_shared<int>(1)); }, 1, n);
}
BENCHMARK(CoreCachedSharedPtrSingleThreadReset, n) {
  folly::CoreCachedSharedPtr<int> p(std::make_shared<int>(1));
  parallelRun([&] { p.reset(std::make_shared<int>(1)); }, 1, n);
}
BENCHMARK(AtomicCoreCachedSharedPtrSingleThreadReset, n) {
  folly::AtomicCoreCachedSharedPtr<int> p(std::make_shared<int>(1));
  parallelRun([&] { p.reset(std::make_shared<int>(1)); }, 1, n);
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  auto ret = RUN_ALL_TESTS();
  if (ret == 0 && FLAGS_benchmark) {
    folly::runBenchmarks();
  }

  return ret;
}

#endif // #ifdef FOLLY_USE_LIBSTDCPP
