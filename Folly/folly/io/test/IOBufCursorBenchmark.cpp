/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/io/IOBuf.h>

#include <folly/Benchmark.h>
#include <folly/Format.h>
#include <folly/Range.h>
#include <folly/io/Cursor.h>

DECLARE_bool(benchmark);

using folly::ByteRange;
using folly::format;
using folly::IOBuf;
using folly::StringPiece;
using std::unique_ptr;
using namespace folly::io;

int benchmark_size = 1000;
unique_ptr<IOBuf> iobuf_benchmark;

unique_ptr<IOBuf> iobuf_read_benchmark;

template <class CursClass>
void runBenchmark() {
  CursClass c(iobuf_benchmark.get());

  for (int i = 0; i < benchmark_size; i++) {
    c.write((uint8_t)0);
  }
}

BENCHMARK(rwPrivateCursorBenchmark, iters) {
  while (iters--) {
    runBenchmark<RWPrivateCursor>();
  }
}

BENCHMARK(rwUnshareCursorBenchmark, iters) {
  while (iters--) {
    runBenchmark<RWUnshareCursor>();
  }
}

BENCHMARK(cursorBenchmark, iters) {
  while (iters--) {
    Cursor c(iobuf_read_benchmark.get());
    for (int i = 0; i < benchmark_size; i++) {
      c.read<uint8_t>();
    }
  }
}

BENCHMARK(skipBenchmark, iters) {
  while (iters--) {
    Cursor c(iobuf_read_benchmark.get());
    for (int i = 0; i < benchmark_size; i++) {
      c.peekBytes();
      c.skip(1);
    }
  }
}

BENCHMARK(cloneBenchmark, iters) {
  folly::IOBuf out;
  while (iters--) {
    Cursor c(iobuf_read_benchmark.get());
    for (int i = 0; i < benchmark_size; ++i) {
      c.clone(out, 1);
    }
  }
}

BENCHMARK(read, iters) {
  while (iters--) {
    Cursor c(iobuf_read_benchmark.get());
    for (int i = 0; i < benchmark_size; ++i) {
      const auto val = c.read<uint8_t>();
      folly::doNotOptimizeAway(val);
    }
  }
}

BENCHMARK(readSlow, iters) {
  while (iters--) {
    Cursor c(iobuf_read_benchmark.get());
    const int size = benchmark_size / 2;
    for (int i = 0; i < size; ++i) {
      const auto val = c.read<uint16_t>();
      folly::doNotOptimizeAway(val);
    }
  }
}

bool prefixBaseline(Cursor& c, const std::array<uint8_t, 4>& expected) {
  std::array<uint8_t, 4> actual;
  if (c.pullAtMost(actual.data(), actual.size()) != actual.size()) {
    return false;
  }
  return memcmp(actual.data(), expected.data(), actual.size()) == 0;
}

bool prefix(Cursor& c, uint32_t expected) {
  uint32_t actual;
  if (!c.tryReadLE(actual)) {
    return false;
  }
  return actual == expected;
}

BENCHMARK(prefixBaseline, iters) {
  IOBuf buf{IOBuf::CREATE, 10};
  buf.append(10);
  constexpr std::array<uint8_t, 4> prefix = {{0x01, 0x02, 0x03, 0x04}};
  while (iters--) {
    for (int i = 0; i < benchmark_size; ++i) {
      Cursor c(&buf);
      bool result = prefixBaseline(c, prefix);
      folly::doNotOptimizeAway(result);
    }
  }
}

BENCHMARK_RELATIVE(prefix, iters) {
  IOBuf buf{IOBuf::CREATE, 10};
  buf.append(10);
  while (iters--) {
    for (int i = 0; i < benchmark_size; ++i) {
      Cursor c(&buf);
      bool result = prefix(c, 0x01020304);
      folly::doNotOptimizeAway(result);
    }
  }
}

/**
 * ============================================================================
 * folly/io/test/IOBufCursorBenchmark.cpp          relative  time/iter  iters/s
 * ============================================================================
 * rwPrivateCursorBenchmark                                     1.01us  985.85K
 * rwUnshareCursorBenchmark                                     1.01us  986.70K
 * cursorBenchmark                                              4.77us  209.61K
 * skipBenchmark                                                4.78us  209.42K
 * cloneBenchmark                                              26.65us   37.52K
 * read                                                         4.35us  230.07K
 * readSlow                                                     5.45us  183.48K
 * prefixBaseline                                               6.44us  155.24K
 * prefix                                           589.31%     1.09us  914.87K
 * ============================================================================
 */

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  iobuf_benchmark = IOBuf::create(benchmark_size);
  iobuf_benchmark->append(benchmark_size);

  iobuf_read_benchmark = IOBuf::create(1);
  for (int i = 0; i < benchmark_size; i++) {
    unique_ptr<IOBuf> iobuf2(IOBuf::create(1));
    iobuf2->append(1);
    iobuf_read_benchmark->prependChain(std::move(iobuf2));
  }

  folly::runBenchmarks();
  return 0;
}
