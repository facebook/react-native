/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/container/BitIterator.h>

#include <algorithm>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/init/Init.h>
#include <folly/small_vector.h>

using namespace folly;

namespace {

template <class BaseIter>
BitIterator<BaseIter> simpleFFS(
    BitIterator<BaseIter> begin,
    BitIterator<BaseIter> end) {
  return std::find(begin, end, true);
}

template <class FFS>
void runFFSTest(FFS fn) {
  constexpr size_t const maxblocks = 3;
  constexpr size_t const bpb = 8 * sizeof(uint64_t);
  for (size_t nblocks = 1; nblocks <= maxblocks; ++nblocks) {
    small_vector<uint64_t, maxblocks> data(nblocks, 0);
    size_t nbits = nblocks * bpb;
    auto begin = makeBitIterator(data.cbegin());
    auto end = makeBitIterator(data.cend());
    DCHECK_EQ(nbits, end - begin);
    DCHECK(begin != end);

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
          doNotOptimizeAway(p);
          if (firstSet < startBit + 1 || firstSet >= endBit + 1) {
            DCHECK_EQ(endBit, p - begin)
                << "  firstSet=" << firstSet << " startBit=" << startBit
                << " endBit=" << endBit << " nblocks=" << nblocks;
          } else {
            DCHECK_EQ(firstSet - 1, p - begin)
                << "  firstSet=" << firstSet << " startBit=" << startBit
                << " endBit=" << endBit << " nblocks=" << nblocks;
          }
        }
      }
    }
  }
}

void runSimpleFFSTest(int iters) {
  while (iters--) {
    runFFSTest([](auto first, auto last) { return simpleFFS(first, last); });
  }
}

void runRealFFSTest(int iters) {
  while (iters--) {
    runFFSTest([](auto first, auto last) { return findFirstSet(first, last); });
  }
}

} // namespace

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
  folly::init(&argc, &argv);
  folly::runBenchmarks();
  return 0;
}
