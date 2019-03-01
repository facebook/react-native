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

#include <folly/Bits.h>

#include <algorithm>
#include <type_traits>
#include <limits>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::bititerator_detail;

namespace {

template <class INT, class IT>
void checkIt(INT exp, IT& it) {
  typedef typename std::make_unsigned<INT>::type utype;
  size_t bits = std::numeric_limits<utype>::digits;
  utype uexp = exp;
  for (size_t i = 0; i < bits; ++i) {
    bool e = uexp & 1;
    EXPECT_EQ(e, *it++);
    uexp >>= 1;
  }
}

template <class INT, class IT>
void checkRange(INT exp, IT begin, IT end) {
  typedef typename std::make_unsigned<INT>::type utype;
  utype uexp = exp;
  size_t i = 0;
  auto bitEnd = makeBitIterator(end);
  for (BitIterator<IT> it = makeBitIterator(begin); it != bitEnd; ++it, ++i) {
    bool e = uexp & 1;
    EXPECT_EQ(e, *it);
    uexp >>= 1;
  }
}

}  // namespace

TEST(BitIterator, Simple) {
  std::vector<int> v;
  v.push_back(0x10);
  v.push_back(0x42);
  auto bi(makeBitIterator(v.begin()));
  checkIt(0x10, bi);
  checkIt(0x42, bi);
  checkRange(0x0000004200000010ULL, v.begin(), v.end());

  v[0] = 0;
  bi = v.begin();
  *bi++ = true;     // 1
  *bi++ = false;
  *bi++ = true;     // 4
  *bi++ = false;
  *bi++ = false;
  *bi++ = true;     // 32
  *++bi = true;     // 128 (note pre-increment)

  EXPECT_EQ(165, v[0]);
}

TEST(BitIterator, Const) {
  std::vector<int> v;
  v.push_back(0x10);
  v.push_back(0x42);
  auto bi(makeBitIterator(v.cbegin()));
  checkIt(0x10, bi);
  checkIt(0x42, bi);
}

namespace {

template <class BaseIter>
BitIterator<BaseIter> simpleFFS(BitIterator<BaseIter> begin,
                                BitIterator<BaseIter> end) {
  return std::find(begin, end, true);
}

template <class FFS>
void runFFSTest(FFS fn) {
  static const size_t bpb = 8 * sizeof(uint64_t);
  std::vector<uint64_t> data;
  for (size_t nblocks = 1; nblocks <= 3; ++nblocks) {
    size_t nbits = nblocks * bpb;
    data.resize(nblocks);
    auto begin = makeBitIterator(data.cbegin());
    auto end = makeBitIterator(data.cend());
    EXPECT_EQ(nbits, end - begin);
    EXPECT_FALSE(begin == end);

    // Try every possible combination of first bit set (including none),
    // start bit, end bit
    for (size_t firstSet = 0; firstSet <= nbits; ++firstSet) {
      data.assign(nblocks, 0);
      if (firstSet) {
        size_t b = firstSet - 1;
        data[b / bpb] |= (1ULL << (b % bpb));
      }
      for (size_t startBit = 0; startBit <= nbits; ++startBit) {
        for (size_t endBit = startBit; endBit <= nbits; ++endBit) {
          auto p = begin + startBit;
          auto q = begin + endBit;
          p = fn(p, q);
          if (firstSet < startBit + 1 || firstSet >= endBit + 1) {
            EXPECT_EQ(endBit, p - begin)
              << "  firstSet=" << firstSet << " startBit=" << startBit
              << " endBit=" << endBit << " nblocks=" << nblocks;
          } else {
            EXPECT_EQ(firstSet - 1, p - begin)
              << "  firstSet=" << firstSet << " startBit=" << startBit
              << " endBit=" << endBit << " nblocks=" << nblocks;
          }
        }
      }
    }
  }
}

void runSimpleFFSTest(int iters) {
  auto fn = simpleFFS<std::vector<uint64_t>::const_iterator>;
  while (iters--) {
    runFFSTest(fn);
  }
}

void runRealFFSTest(int iters) {
  auto fn = findFirstSet<std::vector<uint64_t>::const_iterator>;
  while (iters--) {
    runFFSTest(fn);
  }
}

}

TEST(BitIterator, SimpleFindFirstSet) {
  runSimpleFFSTest(1);
}

TEST(BitIterator, FindFirstSet) {
  runRealFFSTest(1);
}

BENCHMARK(SimpleFFSTest, iters) {
  runSimpleFFSTest(iters);
}
BENCHMARK(RealFFSTest, iters) {
  runRealFFSTest(iters);
}

/* --bm_min_iters=10 --bm_max_iters=100

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
runSimpleFFSTest                           10   4.82 s     482 ms  2.075
runRealFFSTest                             19  2.011 s   105.9 ms  9.447

*/

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  auto ret = RUN_ALL_TESTS();
  if (!ret && FLAGS_benchmark) {
    folly::runBenchmarks();
  }
  return ret;
}
