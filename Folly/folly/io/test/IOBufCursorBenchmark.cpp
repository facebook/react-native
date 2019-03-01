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

// fbmake opt
// _bin/folly/experimental/io/test/iobuf_cursor_test -benchmark
//
// Benchmark                               Iters   Total t    t/iter iter/sec
// ---------------------------------------------------------------------------
// rwPrivateCursorBenchmark               100000  142.9 ms  1.429 us  683.5 k
// rwUnshareCursorBenchmark               100000  309.3 ms  3.093 us  315.7 k
// cursorBenchmark                        100000  741.4 ms  7.414 us  131.7 k
// skipBenchmark                          100000  738.9 ms  7.389 us  132.2 k
//
// uname -a:
//
// Linux dev2159.snc6.facebook.com 2.6.33-7_fbk15_104e4d0 #1 SMP
// Tue Oct 19 22:40:30 PDT 2010 x86_64 x86_64 x86_64 GNU/Linux
//
// 72GB RAM, 2 CPUs (Intel(R) Xeon(R) CPU L5630  @ 2.13GHz)
// hyperthreading disabled

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
