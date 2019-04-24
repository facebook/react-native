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

// @author Tudor Bosman (tudorb@fb.com)

#include <algorithm>
#include <vector>

#include <folly/CppAttributes.h>
#include <folly/Random.h>
#include <folly/lang/Assume.h>
#include <folly/lang/Bits.h>

#include <folly/Benchmark.h>

using namespace folly;

BENCHMARK(nextPowTwoClz, iters) {
  for (unsigned long i = 0; i < iters; ++i) {
    auto x = folly::nextPowTwo(i);
    folly::doNotOptimizeAway(x);
  }
}

BENCHMARK_DRAW_LINE();
BENCHMARK(isPowTwo, iters) {
  bool b;
  for (unsigned long i = 0; i < iters; ++i) {
    b = folly::isPowTwo(i);
    folly::doNotOptimizeAway(b);
  }
}

BENCHMARK_DRAW_LINE();
BENCHMARK(reverse, iters) {
  uint64_t b = 0;
  for (unsigned long i = 0; i < iters; ++i) {
    b = folly::bitReverse(i + b);
    folly::doNotOptimizeAway(b);
  }
}

namespace {

template <class F>
void testPartialLoadUnaligned(F f, size_t iters) {
  constexpr size_t kBufSize = 32;

  std::vector<char> buf;
  BENCHMARK_SUSPEND {
    buf.resize(kBufSize + 7); // Allow unguarded tail reads.
    std::generate(
        buf.begin(), buf.end(), [] { return folly::Random::rand32(255); });
  }

  uint64_t ret = 0;
  for (size_t i = 0; i < iters; ++i) {
    // Make the position depend on the previous result to break loop pipelining.
    auto pos = ret % kBufSize;
    ret = f(buf.data() + pos, i % 8);
    folly::doNotOptimizeAway(ret);
  }
}

/**
 * An alternative implementation of partialLoadUnaligned that has
 * comparable performance. Not worth the extra complexity and code
 * size, leaving it here for future consideration in case the relative
 * performance changes.
 */
uint64_t partialLoadUnalignedSwitch(const char* p, size_t l) {
  folly::assume(l < 8);

  uint64_t r = 0;
  switch (l) {
    case 7:
      r = static_cast<uint64_t>(folly::loadUnaligned<uint32_t>(p + 3)) << 24;
      FOLLY_FALLTHROUGH;
    case 3:
      r |= static_cast<uint64_t>(folly::loadUnaligned<uint16_t>(p + 1)) << 8;
      FOLLY_FALLTHROUGH;
    case 1:
      r |= *p;
      break;

    case 6:
      r = static_cast<uint64_t>(folly::loadUnaligned<uint16_t>(p + 4)) << 32;
      FOLLY_FALLTHROUGH;
    case 4:
      r |= folly::loadUnaligned<uint32_t>(p);
      break;

    case 5:
      r = static_cast<uint64_t>(folly::loadUnaligned<uint32_t>(p + 4)) << 32;
      r |= *p;
      break;

    case 2:
      r = folly::loadUnaligned<uint16_t>(p);
      break;

    case 0:
      break;
  }

  return r;
}

} // namespace

BENCHMARK_DRAW_LINE();

BENCHMARK(PartialLoadUnaligned, iters) {
  testPartialLoadUnaligned(folly::partialLoadUnaligned<uint64_t>, iters);
}

BENCHMARK(PartialLoadUnalignedMemcpy, iters) {
  testPartialLoadUnaligned(
      [](const char* p, size_t l) {
        folly::assume(l < 8);

        uint64_t ret;
        memcpy(&ret, p, l);
        return ret;
      },
      iters);
}

BENCHMARK(PartialLoadUnalignedSwitch, iters) {
  testPartialLoadUnaligned(partialLoadUnalignedSwitch, iters);
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

/*
Benchmarks run on Intel Xeon CPU E5-2678 v3 @ 2.50GHz with --bm_min_usec=500000

============================================================================
folly/lang/test/BitsBenchmark.cpp               relative  time/iter  iters/s
============================================================================
nextPowTwoClz                                                0.00fs  Infinity
----------------------------------------------------------------------------
isPowTwo                                                     0.00fs  Infinity
----------------------------------------------------------------------------
reverse                                                      4.18ns  239.14M
----------------------------------------------------------------------------
PartialLoadUnaligned                                         2.22ns  449.80M
PartialLoadUnalignedMemcpy                                   7.53ns  132.78M
PartialLoadUnalignedSwitch                                   2.04ns  491.30M
============================================================================
*/
