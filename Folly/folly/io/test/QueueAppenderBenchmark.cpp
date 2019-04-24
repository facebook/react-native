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

#include <folly/Benchmark.h>
#include <folly/Format.h>
#include <folly/Range.h>
#include <folly/io/Cursor.h>
#include <folly/io/IOBufQueue.h>

DECLARE_bool(benchmark);

using namespace folly::io;

constexpr size_t kBenchmarkSize = 4096;

template <class T>
void runArithmeticBench(int64_t iters) {
  while (iters--) {
    folly::IOBufQueue queue;
    QueueAppender appender(&queue, kBenchmarkSize);
    for (size_t i = 0; i < kBenchmarkSize / sizeof(T); ++i) {
      appender.write((T)0xFB);
    }
    folly::doNotOptimizeAway(queue.move());
  }
}

BENCHMARK(write_uint8, iters) {
  runArithmeticBench<uint8_t>(iters);
}

BENCHMARK(write_uint16, iters) {
  runArithmeticBench<uint16_t>(iters);
}

BENCHMARK(write_uint32, iters) {
  runArithmeticBench<uint32_t>(iters);
}

void runPushBenchmark(int64_t iters, const std::string& str) {
  constexpr size_t kNumPushPerIter = 1024;
  while (iters--) {
    folly::IOBufQueue queue;
    QueueAppender appender(&queue, kBenchmarkSize);
    for (size_t i = 0; i < kNumPushPerIter; ++i) {
      appender.push(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    }
    folly::doNotOptimizeAway(queue.move());
  }
}

BENCHMARK(push_64b, iters) {
  std::string data;
  BENCHMARK_SUSPEND {
    data = std::string(64, 'f');
  }
  runPushBenchmark(iters, data);
}

BENCHMARK(push_1024b, iters) {
  std::string data;
  BENCHMARK_SUSPEND {
    data = std::string(1024, 'b');
  }
  runPushBenchmark(iters, data);
}

BENCHMARK(append, iters) {
  constexpr size_t kNumAppendPerIter = 1024;

  std::unique_ptr<folly::IOBuf> largeBuffer;
  BENCHMARK_SUSPEND {
    largeBuffer = folly::IOBuf::create(1024);
    largeBuffer->append(1024);
  }

  while (iters--) {
    folly::IOBufQueue queue;
    QueueAppender appender(&queue, kBenchmarkSize);
    for (size_t i = 0; i < kNumAppendPerIter; ++i) {
      appender.insert(largeBuffer->clone());
    }
    folly::doNotOptimizeAway(queue.move());
  }
}

void preallocate_postallocate_bench(int64_t iters, size_t size) {
  std::string data;
  BENCHMARK_SUSPEND {
    data = std::string(size, 'f');
  }
  while (iters--) {
    folly::IOBufQueue queue;
    for (size_t i = 0; i < kBenchmarkSize; ++i) {
      auto range = queue.preallocate(size, kBenchmarkSize);
      memcpy(range.first, data.data(), size);
      queue.postallocate(size);
    }
    folly::doNotOptimizeAway(queue.move());
  }
}

BENCHMARK(preallocate_postallocate_1b, iters) {
  preallocate_postallocate_bench(iters, 1);
}

BENCHMARK(preallocate_postallocate_4b, iters) {
  preallocate_postallocate_bench(iters, 4);
}

BENCHMARK(preallocate_postallocate_32b, iters) {
  preallocate_postallocate_bench(iters, 32);
}

BENCHMARK(preallocate_postallocate_256b, iters) {
  preallocate_postallocate_bench(iters, 256);
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
