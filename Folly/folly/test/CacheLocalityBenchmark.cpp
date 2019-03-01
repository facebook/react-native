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

#include <folly/detail/CacheLocality.h>

#include <memory>
#include <thread>
#include <unordered_map>

#include <glog/logging.h>

#include <folly/Benchmark.h>

using namespace folly::detail;

#define DECLARE_SPREADER_TAG(tag, locality, func)      \
  namespace {                                          \
  template <typename dummy>                            \
  struct tag {};                                       \
  }                                                    \
  namespace folly {                                    \
  namespace detail {                                   \
  template <>                                          \
  const CacheLocality& CacheLocality::system<tag>() {  \
    static auto* inst = new CacheLocality(locality);   \
    return *inst;                                      \
  }                                                    \
  template <>                                          \
  Getcpu::Func AccessSpreader<tag>::pickGetcpuFunc() { \
    return func;                                       \
  }                                                    \
  }                                                    \
  }

DECLARE_SPREADER_TAG(
    ThreadLocalTag,
    CacheLocality::system<>(),
    folly::detail::FallbackGetcpu<SequentialThreadId<std::atomic>>::getcpu)
DECLARE_SPREADER_TAG(PthreadSelfTag,
                     CacheLocality::system<>(),
                     folly::detail::FallbackGetcpu<HashingThreadId>::getcpu)

BENCHMARK(AccessSpreaderUse, iters) {
  for (unsigned long i = 0; i < iters; ++i) {
    auto x = AccessSpreader<>::current(16);
    folly::doNotOptimizeAway(x);
  }
}

// Benchmark scores here reflect the time for 32 threads to perform an
// atomic increment on a dual-socket E5-2660 @ 2.2Ghz.  Surprisingly,
// if we don't separate the counters onto unique 128 byte stripes the
// 1_stripe and 2_stripe results are identical, even though the L3 is
// claimed to have 64 byte cache lines.
//
// Getcpu refers to the vdso getcpu implementation.  ThreadLocal refers
// to execution using SequentialThreadId, the fallback if the vdso
// getcpu isn't available.  PthreadSelf hashes the value returned from
// pthread_self() as a fallback-fallback for systems that don't have
// thread-local support.
//
// At 16_stripe_0_work and 32_stripe_0_work there is only L1 traffic,
// so since the stripe selection is 12 nanos the atomic increments in
// the L1 is ~17 nanos.  At width 8_stripe_0_work the line is expected
// to ping-pong almost every operation, since the loops have the same
// duration.  Widths 4 and 2 have the same behavior, but each tour of the
// cache line is 4 and 8 cores long, respectively.  These all suggest a
// lower bound of 60 nanos for intra-chip handoff and increment between
// the L1s.
//
// With 420 nanos of busywork per contended increment, the system can
// hide all of the latency of a tour of length 4, but not quite one of
// length 8.  I was a bit surprised at how much worse the non-striped
// version got.  It seems that the inter-chip traffic also interferes
// with the L1-only localWork.load().  When the local work is doubled
// to about 1 microsecond we see that the inter-chip contention is still
// very important, but subdivisions on the same chip don't matter.
//
// sudo nice -n -20 buck-out/gen/folly/test/cache_locality_test
//     --benchmark --bm_min_iters=1000000
// ============================================================================
// folly/test/CacheLocalityTest.cpp                relative  time/iter  iters/s
// ============================================================================
// AccessSpreaderUse                                           11.94ns   83.79M
// ----------------------------------------------------------------------------
// contentionAtWidthGetcpu(1_stripe_0_work)                   985.75ns    1.01M
// contentionAtWidthGetcpu(2_stripe_0_work)                   424.02ns    2.36M
// contentionAtWidthGetcpu(4_stripe_0_work)                   190.13ns    5.26M
// contentionAtWidthGetcpu(8_stripe_0_work)                    91.86ns   10.89M
// contentionAtWidthGetcpu(16_stripe_0_work)                   29.31ns   34.12M
// contentionAtWidthGetcpu(32_stripe_0_work)                   29.53ns   33.86M
// contentionAtWidthGetcpu(64_stripe_0_work)                   29.93ns   33.41M
// contentionAtWidthThreadLocal(2_stripe_0_work)              609.21ns    1.64M
// contentionAtWidthThreadLocal(4_stripe_0_work)              303.60ns    3.29M
// contentionAtWidthThreadLocal(8_stripe_0_work)              246.57ns    4.06M
// contentionAtWidthThreadLocal(16_stripe_0_work)             154.84ns    6.46M
// contentionAtWidthThreadLocal(32_stripe_0_work)              24.14ns   41.43M
// contentionAtWidthThreadLocal(64_stripe_0_work)              23.95ns   41.75M
// contentionAtWidthPthreadSelf(2_stripe_0_work)              722.01ns    1.39M
// contentionAtWidthPthreadSelf(4_stripe_0_work)              501.56ns    1.99M
// contentionAtWidthPthreadSelf(8_stripe_0_work)              474.58ns    2.11M
// contentionAtWidthPthreadSelf(16_stripe_0_work)             300.90ns    3.32M
// contentionAtWidthPthreadSelf(32_stripe_0_work)             175.77ns    5.69M
// contentionAtWidthPthreadSelf(64_stripe_0_work)             174.88ns    5.72M
// atomicIncrBaseline(local_incr_0_work)                       16.81ns   59.51M
// ----------------------------------------------------------------------------
// contentionAtWidthGetcpu(1_stripe_500_work)                   1.82us  549.97K
// contentionAtWidthGetcpu(2_stripe_500_work)                 533.71ns    1.87M
// contentionAtWidthGetcpu(4_stripe_500_work)                 424.64ns    2.35M
// contentionAtWidthGetcpu(8_stripe_500_work)                 451.85ns    2.21M
// contentionAtWidthGetcpu(16_stripe_500_work)                425.54ns    2.35M
// contentionAtWidthGetcpu(32_stripe_500_work)                501.66ns    1.99M
// atomicIncrBaseline(local_incr_500_work)                    438.46ns    2.28M
// ----------------------------------------------------------------------------
// contentionAtWidthGetcpu(1_stripe_1000_work)                  1.88us  532.20K
// contentionAtWidthGetcpu(2_stripe_1000_work)                824.62ns    1.21M
// contentionAtWidthGetcpu(4_stripe_1000_work)                803.56ns    1.24M
// contentionAtWidthGetcpu(8_stripe_1000_work)                926.65ns    1.08M
// contentionAtWidthGetcpu(16_stripe_1000_work)               900.10ns    1.11M
// contentionAtWidthGetcpu(32_stripe_1000_work)               890.75ns    1.12M
// atomicIncrBaseline(local_incr_1000_work)                   774.47ns    1.29M
// ============================================================================
template <template <typename> class Tag>
static void contentionAtWidth(size_t iters, size_t stripes, size_t work) {
  const size_t counterAlignment = 128;
  const size_t numThreads = 32;

  folly::BenchmarkSuspender braces;

  std::atomic<size_t> ready(0);
  std::atomic<bool> go(false);

  // while in theory the cache line size is 64 bytes, experiments show
  // that we get contention on 128 byte boundaries for Ivy Bridge.  The
  // extra indirection adds 1 or 2 nanos
  assert(counterAlignment >= sizeof(std::atomic<size_t>));
  std::vector<char> raw(counterAlignment * stripes);

  // if we happen to be using the tlsRoundRobin, then sequentially
  // assigning the thread identifiers is the unlikely best-case scenario.
  // We don't want to unfairly benefit or penalize.  Computing the exact
  // maximum likelihood of the probability distributions is annoying, so
  // I approximate as 2/5 of the ids that have no threads, 2/5 that have
  // 1, 2/15 that have 2, and 1/15 that have 3.  We accomplish this by
  // wrapping back to slot 0 when we hit 1/15 and 1/5.

  std::vector<std::thread> threads;
  while (threads.size() < numThreads) {
    threads.push_back(std::thread([&, iters, stripes, work]() {
      auto counters = std::vector<std::atomic<size_t>*>(stripes);
      for (size_t i = 0; i < stripes; ++i) {
        counters[i] =
            new (raw.data() + counterAlignment * i) std::atomic<size_t>();
      }

      ready++;
      while (!go.load()) {
        std::this_thread::yield();
      }
      std::atomic<int> localWork(0);
      for (size_t i = iters; i > 0; --i) {
        ++*(counters[AccessSpreader<Tag>::current(stripes)]);
        for (size_t j = work; j > 0; --j) {
          localWork.load();
        }
      }
    }));

    if (threads.size() == numThreads / 15 || threads.size() == numThreads / 5) {
      // create a few dummy threads to wrap back around to 0 mod numCpus
      for (size_t i = threads.size(); i != numThreads; ++i) {
        std::thread([&]() { AccessSpreader<Tag>::current(stripes); }).join();
      }
    }
  }

  while (ready < numThreads) {
    std::this_thread::yield();
  }
  braces.dismiss();
  go = true;

  for (auto& thr : threads) {
    thr.join();
  }
}

static void atomicIncrBaseline(size_t iters,
                               size_t work,
                               size_t numThreads = 32) {
  folly::BenchmarkSuspender braces;

  std::atomic<bool> go(false);

  std::vector<std::thread> threads;
  while (threads.size() < numThreads) {
    threads.push_back(std::thread([&]() {
      while (!go.load()) {
        std::this_thread::yield();
      }
      std::atomic<size_t> localCounter(0);
      std::atomic<int> localWork(0);
      for (size_t i = iters; i > 0; --i) {
        localCounter++;
        for (size_t j = work; j > 0; --j) {
          localWork.load();
        }
      }
    }));
  }

  braces.dismiss();
  go = true;

  for (auto& thr : threads) {
    thr.join();
  }
}

static void contentionAtWidthGetcpu(size_t iters, size_t stripes, size_t work) {
  contentionAtWidth<std::atomic>(iters, stripes, work);
}

static void contentionAtWidthThreadLocal(size_t iters,
                                         size_t stripes,
                                         size_t work) {
  contentionAtWidth<ThreadLocalTag>(iters, stripes, work);
}

static void contentionAtWidthPthreadSelf(size_t iters,
                                         size_t stripes,
                                         size_t work) {
  contentionAtWidth<PthreadSelfTag>(iters, stripes, work);
}

BENCHMARK_DRAW_LINE()
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 1_stripe_0_work, 1, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 2_stripe_0_work, 2, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 4_stripe_0_work, 4, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 8_stripe_0_work, 8, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 16_stripe_0_work, 16, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 32_stripe_0_work, 32, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 64_stripe_0_work, 64, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 2_stripe_0_work, 2, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 4_stripe_0_work, 4, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 8_stripe_0_work, 8, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 16_stripe_0_work, 16, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 32_stripe_0_work, 32, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthThreadLocal, 64_stripe_0_work, 64, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 2_stripe_0_work, 2, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 4_stripe_0_work, 4, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 8_stripe_0_work, 8, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 16_stripe_0_work, 16, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 32_stripe_0_work, 32, 0)
BENCHMARK_NAMED_PARAM(contentionAtWidthPthreadSelf, 64_stripe_0_work, 64, 0)
BENCHMARK_NAMED_PARAM(atomicIncrBaseline, local_incr_0_work, 0)
BENCHMARK_DRAW_LINE()
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 1_stripe_500_work, 1, 500)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 2_stripe_500_work, 2, 500)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 4_stripe_500_work, 4, 500)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 8_stripe_500_work, 8, 500)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 16_stripe_500_work, 16, 500)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 32_stripe_500_work, 32, 500)
BENCHMARK_NAMED_PARAM(atomicIncrBaseline, local_incr_500_work, 500)
BENCHMARK_DRAW_LINE()
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 1_stripe_1000_work, 1, 1000)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 2_stripe_1000_work, 2, 1000)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 4_stripe_1000_work, 4, 1000)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 8_stripe_1000_work, 8, 1000)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 16_stripe_1000_work, 16, 1000)
BENCHMARK_NAMED_PARAM(contentionAtWidthGetcpu, 32_stripe_1000_work, 32, 1000)
BENCHMARK_NAMED_PARAM(atomicIncrBaseline, local_incr_1000_work, 1000)

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
