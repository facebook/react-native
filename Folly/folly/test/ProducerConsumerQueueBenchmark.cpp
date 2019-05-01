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

// @author: Bert Maher <bertrand@fb.com>

#include <folly/ProducerConsumerQueue.h>

#include <cstdio>
#include <iostream>
#include <thread>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/PThread.h>
#include <folly/stats/Histogram-defs.h>
#include <folly/stats/Histogram.h>

namespace {

using namespace folly;

typedef unsigned int ThroughputType;
typedef ProducerConsumerQueue<ThroughputType> ThroughputQueueType;

typedef unsigned long LatencyType;
typedef ProducerConsumerQueue<LatencyType> LatencyQueueType;

template <class QueueType>
struct ThroughputTest {
  explicit ThroughputTest(size_t size, int iters, int cpu0, int cpu1)
      : queue_(size), done_(false), iters_(iters), cpu0_(cpu0), cpu1_(cpu1) {}

  void producer() {
    if (cpu0_ > -1) {
      cpu_set_t cpuset;
      CPU_ZERO(&cpuset);
      CPU_SET(cpu0_, &cpuset);
      pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    }
    for (int i = 0; i < iters_; ++i) {
      ThroughputType item = i;
      while (!queue_.write((ThroughputType)item)) {
      }
    }
  }

  void consumer() {
    if (cpu1_ > -1) {
      cpu_set_t cpuset;
      CPU_ZERO(&cpuset);
      CPU_SET(cpu1_, &cpuset);
      pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    }
    for (int i = 0; i < iters_; ++i) {
      ThroughputType item = 0;
      while (!queue_.read(item)) {
      }
      doNotOptimizeAway(item);
    }
  }

  QueueType queue_;
  std::atomic<bool> done_;
  const int iters_;
  int cpu0_;
  int cpu1_;
};

template <class QueueType>
struct LatencyTest {
  explicit LatencyTest(size_t size, int iters, int cpu0, int cpu1)
      : queue_(size),
        done_(false),
        iters_(iters),
        cpu0_(cpu0),
        cpu1_(cpu1),
        hist_(1, 0, 30) {
    computeTimeCost();
  }

  static uint64_t timespecDiff(timespec end, timespec start) {
    if (end.tv_sec == start.tv_sec) {
      assert(end.tv_nsec >= start.tv_nsec);
      return uint64_t(end.tv_nsec - start.tv_nsec);
    }
    assert(end.tv_sec > start.tv_sec);
    auto diff = uint64_t(end.tv_sec - start.tv_sec);
    assert(diff < std::numeric_limits<uint64_t>::max() / 1000000000ULL);
    return diff * 1000000000ULL + end.tv_nsec - start.tv_nsec;
  }

  void computeTimeCost() {
    timespec start, end;
    clock_gettime(CLOCK_REALTIME, &start);
    for (int i = 0; i < iters_; ++i) {
      timespec tv;
      clock_gettime(CLOCK_REALTIME, &tv);
    }
    clock_gettime(CLOCK_REALTIME, &end);
    time_cost_ = 2 * timespecDiff(end, start) / iters_;
  }

  void producer() {
    if (cpu0_ > -1) {
      cpu_set_t cpuset;
      CPU_ZERO(&cpuset);
      CPU_SET(cpu0_, &cpuset);
      pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    }
    for (int i = 0; i < iters_; ++i) {
      timespec sleeptime, sleepstart;
      clock_gettime(CLOCK_REALTIME, &sleepstart);
      do {
        clock_gettime(CLOCK_REALTIME, &sleeptime);
      } while (timespecDiff(sleeptime, sleepstart) < 1000000);

      timespec tv;
      clock_gettime(CLOCK_REALTIME, &tv);
      while (!queue_.write((LatencyType)tv.tv_nsec)) {
      }
    }
  }

  void consumer() {
    if (cpu1_ > -1) {
      cpu_set_t cpuset;
      CPU_ZERO(&cpuset);
      CPU_SET(cpu1_, &cpuset);
      pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    }
    for (int i = 0; i < iters_; ++i) {
      unsigned long enqueue_nsec;
      while (!queue_.read(enqueue_nsec)) {
      }

      timespec tv;
      clock_gettime(CLOCK_REALTIME, &tv);
      int diff = tv.tv_nsec - enqueue_nsec - time_cost_;
      if (diff < 0) {
        continue;
      }

      // Naive log-scale bucketing.
      int bucket;
      for (bucket = 0; bucket <= 30 && (1 << bucket) <= diff; ++bucket) {
      }
      hist_.addValue(bucket - 1);
    }
  }

  void printHistogram() {
    hist_.toTSV(std::cout);
  }

  QueueType queue_;
  std::atomic<bool> done_;
  int time_cost_;
  const int iters_;
  int cpu0_;
  int cpu1_;
  Histogram<int> hist_;
};

void BM_ProducerConsumer(int iters, int size) {
  BenchmarkSuspender susp;
  CHECK_GT(size, 0);
  ThroughputTest<ThroughputQueueType>* test =
      new ThroughputTest<ThroughputQueueType>(size, iters, -1, -1);
  susp.dismiss();

  std::thread producer([test] { test->producer(); });
  std::thread consumer([test] { test->consumer(); });

  producer.join();
  test->done_ = true;
  consumer.join();
  delete test;
}

void BM_ProducerConsumerAffinity(int iters, int size) {
  BenchmarkSuspender susp;
  CHECK_GT(size, 0);
  ThroughputTest<ThroughputQueueType>* test =
      new ThroughputTest<ThroughputQueueType>(size, iters, 0, 1);
  susp.dismiss();

  std::thread producer([test] { test->producer(); });
  std::thread consumer([test] { test->consumer(); });

  producer.join();
  test->done_ = true;
  consumer.join();
  delete test;
}

void BM_ProducerConsumerLatency(int /* iters */, int size) {
  BenchmarkSuspender susp;
  CHECK_GT(size, 0);
  LatencyTest<LatencyQueueType>* test =
      new LatencyTest<LatencyQueueType>(size, 100000, 0, 1);
  susp.dismiss();

  std::thread producer([test] { test->producer(); });
  std::thread consumer([test] { test->consumer(); });

  producer.join();
  test->done_ = true;
  consumer.join();
  test->printHistogram();
  delete test;
}

BENCHMARK_DRAW_LINE();

BENCHMARK_PARAM(BM_ProducerConsumer, 1048574)
BENCHMARK_PARAM(BM_ProducerConsumerAffinity, 1048574)
BENCHMARK_PARAM(BM_ProducerConsumerLatency, 1048574)

} // namespace

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  runBenchmarks();
  return 0;
}

#if 0
/*
Benchmark

$ lscpu
Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                24
On-line CPU(s) list:   0-23
Thread(s) per core:    1
Core(s) per socket:    1
Socket(s):             24
NUMA node(s):          1
Vendor ID:             GenuineIntel
CPU family:            6
Model:                 60
Model name:            Intel Core Processor (Haswell, no TSX)
Stepping:              1
CPU MHz:               2494.244
BogoMIPS:              4988.48
Hypervisor vendor:     KVM
Virtualization type:   full
L1d cache:             32K
L1i cache:             32K
L2 cache:              4096K
NUMA node0 CPU(s):     0-23

$ ../buck-out/gen/folly/test/producer_consumer_queue_benchmark
5       6       1       5
6       7       1893    11358
7       8       39671   277697
8       9       34921   279368
9       10      17799   160191
10      11      3685    36850
11      12      1075    11825
12      13      456     5472
13      14      422     5486
14      15      64      896
15      16      7       105
16      17      3       48
17      18      3       51
============================================================================
folly/test/ProducerConsumerQueueBenchmark.cpp   relative  time/iter  iters/s
============================================================================
----------------------------------------------------------------------------
BM_ProducerConsumer(1048574)                                 5.82ns  171.75M
BM_ProducerConsumerAffinity(1048574)                         7.36ns  135.83M
BM_ProducerConsumerLatency(1048574)                         1.67min    9.99m
============================================================================
*/
#endif
