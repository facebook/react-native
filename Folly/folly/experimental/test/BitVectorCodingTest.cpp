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

#include <algorithm>
#include <numeric>
#include <random>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/experimental/BitVectorCoding.h>
#include <folly/experimental/Select64.h>
#include <folly/experimental/test/CodingTestUtils.h>

using namespace folly::compression;

#ifndef BV_TEST_ARCH
#define BV_TEST_ARCH Default
#endif // BV_TEST_ARCH

class BitVectorCodingTest : public ::testing::Test {
 public:
  void doTestEmpty() {
    typedef BitVectorEncoder<uint32_t, size_t> Encoder;
    typedef BitVectorReader<Encoder, instructions::BV_TEST_ARCH> Reader;
    testEmpty<Reader, Encoder>();
  }

  template <size_t kSkipQuantum, size_t kForwardQuantum>
  void doTestAll() {
    typedef BitVectorEncoder<uint32_t, uint32_t, kSkipQuantum, kForwardQuantum>
        Encoder;
    typedef BitVectorReader<Encoder> Reader;
    testAll<Reader, Encoder>(generateRandomList(100 * 1000, 10 * 1000 * 1000));
    testAll<Reader, Encoder>(generateSeqList(1, 100000, 100));
  }
};

TEST_F(BitVectorCodingTest, Empty) {
  doTestEmpty();
}

TEST_F(BitVectorCodingTest, Simple) {
  doTestAll<0, 0>();
}

TEST_F(BitVectorCodingTest, SkipPointers) {
  doTestAll<128, 0>();
}

TEST_F(BitVectorCodingTest, ForwardPointers) {
  doTestAll<0, 128>();
}

TEST_F(BitVectorCodingTest, SkipForwardPointers) {
  doTestAll<128, 128>();
}

namespace bm {

typedef BitVectorEncoder<uint32_t, uint32_t, 128, 128> Encoder;
typedef BitVectorReader<Encoder> Reader;

std::vector<uint32_t> data;
std::vector<size_t> order;

std::vector<uint32_t> encodeSmallData;
std::vector<uint32_t> encodeLargeData;

typename Encoder::MutableCompressedList list;

void init() {
  std::mt19937 gen;

  data = generateRandomList(100 * 1000, 10 * 1000 * 1000, gen);
  list = Encoder::encode(data.begin(), data.end());

  order.resize(data.size());
  std::iota(order.begin(), order.end(), size_t());
  std::shuffle(order.begin(), order.end(), gen);

  encodeSmallData = generateRandomList(10, 100 * 1000, gen);
  encodeLargeData = generateRandomList(1000 * 1000, 100 * 1000 * 1000, gen);
}

void free() { list.free(); }

} // namespace bm

BENCHMARK(Next, iters) { bmNext<bm::Reader>(bm::list, bm::data, iters); }

size_t Skip_ForwardQ128(size_t iters, size_t logAvgSkip) {
  bmSkip<bm::Reader>(bm::list, bm::data, logAvgSkip, iters);
  return iters;
}

BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 1, 0)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 2, 1)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 4_pm_1, 2)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 16_pm_4, 4)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 64_pm_16, 6)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 256_pm_64, 8)
BENCHMARK_NAMED_PARAM_MULTI(Skip_ForwardQ128, 1024_pm_256, 10)

BENCHMARK(Jump_ForwardQ128, iters) {
  bmJump<bm::Reader>(bm::list, bm::data, bm::order, iters);
}

BENCHMARK_DRAW_LINE();

size_t SkipTo_SkipQ128(size_t iters, size_t logAvgSkip) {
  bmSkipTo<bm::Reader>(bm::list, bm::data, logAvgSkip, iters);
  return iters;
}

BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 1, 0)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 2, 1)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 4_pm_1, 2)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 16_pm_4, 4)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 64_pm_16, 6)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 256_pm_64, 8)
BENCHMARK_NAMED_PARAM_MULTI(SkipTo_SkipQ128, 1024_pm_256, 10)

BENCHMARK(JumpTo_SkipQ128, iters) {
  bmJumpTo<bm::Reader>(bm::list, bm::data, bm::order, iters);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Encode_10) {
  auto list = bm::Encoder::encode(bm::encodeSmallData.begin(),
                                  bm::encodeSmallData.end());
  list.free();
}

BENCHMARK(Encode) {
  auto list = bm::Encoder::encode(bm::encodeLargeData.begin(),
                                  bm::encodeLargeData.end());
  list.free();
}

#if 0
Intel(R) Xeon(R) CPU E5-2673 v3 @ 2.40GHz (turbo off),
using instructions::Default and GCC 4.8 with --bm_min_usec 100000.
============================================================================
folly/experimental/test/BitVectorCodingTest.cpp relative  time/iter  iters/s
============================================================================
Next                                                         9.59ns  104.25M
Skip_ForwardQ128(1)                                         11.56ns   86.53M
Skip_ForwardQ128(2)                                         23.30ns   42.93M
Skip_ForwardQ128(4_pm_1)                                    52.99ns   18.87M
Skip_ForwardQ128(16_pm_4)                                  200.85ns    4.98M
Skip_ForwardQ128(64_pm_16)                                 733.20ns    1.36M
Skip_ForwardQ128(256_pm_64)                                748.35ns    1.34M
Skip_ForwardQ128(1024_pm_256)                              742.77ns    1.35M
Jump_ForwardQ128                                           752.98ns    1.33M
----------------------------------------------------------------------------
SkipTo_SkipQ128(1)                                          23.47ns   42.62M
SkipTo_SkipQ128(2)                                          24.48ns   40.85M
SkipTo_SkipQ128(4_pm_1)                                     22.16ns   45.13M
SkipTo_SkipQ128(16_pm_4)                                    28.43ns   35.17M
SkipTo_SkipQ128(64_pm_16)                                   45.51ns   21.97M
SkipTo_SkipQ128(256_pm_64)                                  44.03ns   22.71M
SkipTo_SkipQ128(1024_pm_256)                                45.84ns   21.81M
JumpTo_SkipQ128                                             15.33ns   65.25M
----------------------------------------------------------------------------
Encode_10                                                    1.60us  624.33K
Encode                                                      16.98ms    58.89
============================================================================
#endif

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  auto ret = RUN_ALL_TESTS();
  if (ret == 0 && FLAGS_benchmark) {
    bm::init();
    folly::runBenchmarks();
    bm::free();
  }

  return ret;
}
