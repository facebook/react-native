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
#include <limits>
#include <numeric>
#include <random>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/experimental/EliasFanoCoding.h>
#include <folly/experimental/Select64.h>
#include <folly/experimental/test/CodingTestUtils.h>

using namespace folly::compression;

#ifndef EF_TEST_ARCH
#define EF_TEST_ARCH Default
#endif  // EF_TEST_ARCH

namespace {

uint8_t slowDefaultNumLowerBits(size_t upperBound, size_t size) {
  if (size == 0 || upperBound < size) {
    return 0;
  }
  // floor(log(upperBound / size));
  return uint8_t(folly::findLastSet(upperBound / size) - 1);
}

}  // namespace

TEST(EliasFanoCoding, defaultNumLowerBits) {
  // Verify that slowDefaultNumLowerBits and optimized
  // Encoder::defaultNumLowerBits agree.
  static constexpr size_t kNumIterations = 2500;
  auto compare = [](size_t upperBound, size_t size) {
    using Encoder = EliasFanoEncoderV2<size_t>;
    EXPECT_EQ(int(slowDefaultNumLowerBits(upperBound, size)),
              int(Encoder::defaultNumLowerBits(upperBound, size)))
        << upperBound << " " << size;
  };
  auto batch = [&compare](size_t initialUpperBound) {
    for (size_t upperBound = initialUpperBound, i = 0;
         i < kNumIterations;
         ++i, --upperBound) {
      // Test "size" values close to "upperBound".
      for (size_t size = upperBound, j = 0; j < kNumIterations; ++j, --size) {
        compare(upperBound, size);
      }
      // Sample "size" values between [0, upperBound].
      for (size_t size = upperBound;
           size > 1 + upperBound / kNumIterations;
           size -= 1 + upperBound / kNumIterations) {
        compare(upperBound, size);
      }
      // Test "size" values close to 0.
      for (size_t size = 0; size < kNumIterations; ++size) {
        compare(upperBound, size);
      }
    }
  };
  batch(std::numeric_limits<size_t>::max());
  batch(kNumIterations + 1312213123);
  batch(kNumIterations);

  std::mt19937 gen;
  std::uniform_int_distribution<size_t> distribution;
  for (size_t i = 0; i < kNumIterations; ++i) {
    const auto a = distribution(gen);
    const auto b = distribution(gen);
    compare(std::max(a, b), std::min(a, b));
  }
}

class EliasFanoCodingTest : public ::testing::Test {
 public:
  void doTestEmpty() {
    typedef EliasFanoEncoderV2<uint32_t, size_t> Encoder;
    typedef EliasFanoReader<Encoder> Reader;
    testEmpty<Reader, Encoder>();
  }

  template <size_t kSkipQuantum, size_t kForwardQuantum>
  void doTestAll() {
    typedef EliasFanoEncoderV2<
      uint32_t, uint32_t, kSkipQuantum, kForwardQuantum> Encoder;
    typedef EliasFanoReader<Encoder, instructions::EF_TEST_ARCH> Reader;
    testAll<Reader, Encoder>({0});
    testAll<Reader, Encoder>(generateRandomList(100 * 1000, 10 * 1000 * 1000));
    testAll<Reader, Encoder>(generateSeqList(1, 100000, 100));
  }
};

TEST_F(EliasFanoCodingTest, Empty) {
  doTestEmpty();
}

TEST_F(EliasFanoCodingTest, Simple) {
  doTestAll<0, 0>();
}

TEST_F(EliasFanoCodingTest, SkipPointers) {
  doTestAll<128, 0>();
}

TEST_F(EliasFanoCodingTest, ForwardPointers) {
  doTestAll<0, 128>();
}

TEST_F(EliasFanoCodingTest, SkipForwardPointers) {
  doTestAll<128, 128>();
}

TEST_F(EliasFanoCodingTest, Select64) {
  typedef instructions::EF_TEST_ARCH instr;
  constexpr uint64_t kPrime = uint64_t(-59);
  for (uint64_t x = kPrime, i = 0; i < (1 << 20); x *= kPrime, i += 1) {
    size_t w = instr::popcount(x);
    for (size_t k = 0; k < w; ++k) {
      auto pos = folly::select64<instr>(x, k);
      CHECK_EQ((x >> pos) & 1, 1);
      CHECK_EQ(instr::popcount(x & ((uint64_t(1) << pos) - 1)), k);
    }
  }
}

TEST_F(EliasFanoCodingTest, BugLargeGapInUpperBits) { // t16274876
  typedef EliasFanoEncoderV2<uint32_t, uint32_t, 2, 2> Encoder;
  typedef EliasFanoReader<Encoder, instructions::EF_TEST_ARCH> Reader;
  constexpr uint32_t kLargeValue = 127;

  // Build a list where the upper bits have a large gap after the
  // first element, so that we need to reposition in the upper bits
  // using skips to position the iterator on the second element.
  std::vector<uint32_t> data = {0, kLargeValue};
  for (uint32_t i = 0; i < kLargeValue; ++i) {
    data.push_back(data.back() + 1);
  }
  auto list = Encoder::encode(data.begin(), data.end());

  {
    Reader reader(list);
    ASSERT_TRUE(reader.skipTo(kLargeValue - 1));
    ASSERT_EQ(kLargeValue, reader.value());
    ASSERT_EQ(0, reader.previousValue());
  }
}

namespace bm {

typedef EliasFanoEncoderV2<uint32_t, uint32_t, 128, 128> Encoder;
typedef EliasFanoReader<Encoder> Reader;

std::vector<uint32_t> data;
std::vector<size_t> order;

std::vector<uint32_t> encodeSmallData;
std::vector<uint32_t> encodeLargeData;

std::vector<std::pair<size_t, size_t>> numLowerBitsInput;

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

  std::uniform_int_distribution<size_t> distribution;
  for (size_t i = 0; i < 10000; ++i) {
    const auto a = distribution(gen);
    const auto b = distribution(gen);
    numLowerBitsInput.emplace_back(std::max(a, b), std::min(a, b));
  }
}

void free() {
  list.free();
}

}  // namespace bm

BENCHMARK(Next, iters) {
  bmNext<bm::Reader>(bm::list, bm::data, iters);
}

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

BENCHMARK_DRAW_LINE();

BENCHMARK(defaultNumLowerBits, iters) {
  using Encoder = EliasFanoEncoderV2<size_t>;

  size_t i = 0;
  while (iters--) {
    const auto& p = bm::numLowerBitsInput[i];
    folly::doNotOptimizeAway(Encoder::defaultNumLowerBits(p.first, p.second));
    if (++i == bm::numLowerBitsInput.size()) {
      i = 0;
    }
  }
}

BENCHMARK(slowDefaultNumLowerBits, iters) {
  size_t i = 0;
  while (iters--) {
    const auto& p = bm::numLowerBitsInput[i];
    folly::doNotOptimizeAway(slowDefaultNumLowerBits(p.first, p.second));
    if (++i == bm::numLowerBitsInput.size()) {
      i = 0;
    }
  }
}

#if 0
Intel(R) Xeon(R) CPU E5-2678 v3 @ 2.50GHz (turbo on),
using -DEF_TEST_ARCH Haswell and GCC 4.9 with --bm_min_usec 100000.
============================================================================
folly/experimental/test/EliasFanoCodingTest.cpp relative  time/iter  iters/s
============================================================================
Next                                                         2.31ns  433.77M
Skip_ForwardQ128(1)                                          3.73ns  267.93M
Skip_ForwardQ128(2)                                          4.89ns  204.34M
Skip_ForwardQ128(4_pm_1)                                     6.86ns  145.79M
Skip_ForwardQ128(16_pm_4)                                   18.92ns   52.85M
Skip_ForwardQ128(64_pm_16)                                  26.56ns   37.66M
Skip_ForwardQ128(256_pm_64)                                 30.12ns   33.20M
Skip_ForwardQ128(1024_pm_256)                               30.74ns   32.53M
Jump_ForwardQ128                                            30.49ns   32.80M
----------------------------------------------------------------------------
SkipTo_SkipQ128(1)                                           3.86ns  258.96M
SkipTo_SkipQ128(2)                                           7.73ns  129.36M
SkipTo_SkipQ128(4_pm_1)                                     10.29ns   97.18M
SkipTo_SkipQ128(16_pm_4)                                    28.69ns   34.86M
SkipTo_SkipQ128(64_pm_16)                                   39.73ns   25.17M
SkipTo_SkipQ128(256_pm_64)                                  43.45ns   23.01M
SkipTo_SkipQ128(1024_pm_256)                                44.66ns   22.39M
JumpTo_SkipQ128                                             47.98ns   20.84M
----------------------------------------------------------------------------
Encode_10                                                   77.92ns   12.83M
Encode                                                       4.73ms   211.41
----------------------------------------------------------------------------
defaultNumLowerBits                                          2.20ns  455.01M
slowDefaultNumLowerBits                                      7.90ns  126.59M
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
