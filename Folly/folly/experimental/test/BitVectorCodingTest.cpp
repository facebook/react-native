/*
 * Copyright 2015-present Facebook, Inc.
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
#include <folly/init/Init.h>

using namespace folly::compression;

class BitVectorCodingTest : public ::testing::Test {
 public:
  void doTestEmpty() {
    typedef BitVectorEncoder<uint32_t, size_t> Encoder;
    typedef BitVectorReader<Encoder, instructions::Default> Reader;
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

void free() {
  list.free();
}

} // namespace bm

BENCHMARK(Next, iters) {
  dispatchInstructions([&](auto instructions) {
    bmNext<BitVectorReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, iters);
  });
}

size_t Skip_ForwardQ128(size_t iters, size_t logAvgSkip) {
  dispatchInstructions([&](auto instructions) {
    bmSkip<BitVectorReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, logAvgSkip, iters);
  });
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
  dispatchInstructions([&](auto instructions) {
    bmJump<BitVectorReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, bm::order, iters);
  });
}

BENCHMARK_DRAW_LINE();

size_t SkipTo_SkipQ128(size_t iters, size_t logAvgSkip) {
  dispatchInstructions([&](auto instructions) {
    bmSkipTo<BitVectorReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, logAvgSkip, iters);
  });
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
  dispatchInstructions([&](auto instructions) {
    bmJumpTo<BitVectorReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, bm::order, iters);
  });
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Encode_10) {
  auto list = bm::Encoder::encode(
      bm::encodeSmallData.begin(), bm::encodeSmallData.end());
  list.free();
}

BENCHMARK(Encode) {
  auto list = bm::Encoder::encode(
      bm::encodeLargeData.begin(), bm::encodeLargeData.end());
  list.free();
}

#if 0
// Intel(R) Xeon(R) CPU E5-2678 v3 @ 2.50GHz (turbo on),
// Using GCC 5 with --bm_min_usec 100000.
V1008 12:32:25.863286 101188 Instructions.h:161] Will use folly::compression::instructions::Haswell
============================================================================
folly/experimental/test/BitVectorCodingTest.cpp relative  time/iter  iters/s
============================================================================
Next                                                         9.52ns  104.99M
Skip_ForwardQ128(1)                                         13.90ns   71.96M
Skip_ForwardQ128(2)                                         25.02ns   39.97M
Skip_ForwardQ128(4_pm_1)                                    28.25ns   35.40M
Skip_ForwardQ128(16_pm_4)                                   39.64ns   25.23M
Skip_ForwardQ128(64_pm_16)                                 112.19ns    8.91M
Skip_ForwardQ128(256_pm_64)                                137.75ns    7.26M
Skip_ForwardQ128(1024_pm_256)                              131.56ns    7.60M
Jump_ForwardQ128                                           133.30ns    7.50M
----------------------------------------------------------------------------
SkipTo_SkipQ128(1)                                          13.30ns   75.16M
SkipTo_SkipQ128(2)                                          13.81ns   72.40M
SkipTo_SkipQ128(4_pm_1)                                     12.23ns   81.80M
SkipTo_SkipQ128(16_pm_4)                                    13.72ns   72.89M
SkipTo_SkipQ128(64_pm_16)                                   21.18ns   47.22M
SkipTo_SkipQ128(256_pm_64)                                  20.15ns   49.63M
SkipTo_SkipQ128(1024_pm_256)                                21.86ns   45.74M
JumpTo_SkipQ128                                             23.10ns   43.30M
----------------------------------------------------------------------------
Encode_10                                                  344.50ns    2.90M
Encode                                                      10.88ms    91.90
============================================================================
#endif

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  folly::init(&argc, &argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  auto ret = RUN_ALL_TESTS();
  if (ret == 0 && FLAGS_benchmark) {
    bm::init();
    folly::runBenchmarks();
    bm::free();
  }

  return ret;
}
