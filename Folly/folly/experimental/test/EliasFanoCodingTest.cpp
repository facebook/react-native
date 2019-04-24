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

#include <algorithm>
#include <limits>
#include <numeric>
#include <random>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/experimental/EliasFanoCoding.h>
#include <folly/experimental/Select64.h>
#include <folly/experimental/test/CodingTestUtils.h>
#include <folly/init/Init.h>

using namespace folly::compression;

namespace {

uint8_t slowDefaultNumLowerBits(size_t upperBound, size_t size) {
  if (size == 0 || upperBound < size) {
    return 0;
  }
  // floor(log(upperBound / size));
  return uint8_t(folly::findLastSet(upperBound / size) - 1);
}

} // namespace

TEST(EliasFanoCoding, defaultNumLowerBits) {
  // Verify that slowDefaultNumLowerBits and optimized
  // Encoder::defaultNumLowerBits agree.
  static constexpr size_t kNumIterations = 2500;
  auto compare = [](size_t upperBound, size_t size) {
    using Encoder = EliasFanoEncoderV2<size_t>;
    EXPECT_EQ(
        int(slowDefaultNumLowerBits(upperBound, size)),
        int(Encoder::defaultNumLowerBits(upperBound, size)))
        << upperBound << " " << size;
  };
  auto batch = [&compare](size_t initialUpperBound) {
    for (size_t upperBound = initialUpperBound, i = 0; i < kNumIterations;
         ++i, --upperBound) {
      // Test "size" values close to "upperBound".
      for (size_t size = upperBound, j = 0; j < kNumIterations; ++j, --size) {
        compare(upperBound, size);
      }
      // Sample "size" values between [0, upperBound].
      for (size_t size = upperBound; size > 1 + upperBound / kNumIterations;
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

  template <size_t kSkipQuantum, size_t kForwardQuantum, class SizeType>
  void doTestAll() {
    typedef EliasFanoEncoderV2<
        uint32_t,
        uint32_t,
        kSkipQuantum,
        kForwardQuantum>
        Encoder;
    using Reader =
        EliasFanoReader<Encoder, instructions::Default, false, SizeType>;
    testAll<Reader, Encoder>({0});
    testAll<Reader, Encoder>(generateRandomList(100 * 1000, 10 * 1000 * 1000));
    testAll<Reader, Encoder>(generateSeqList(1, 100000, 100));
  }
};

TEST_F(EliasFanoCodingTest, Empty) {
  doTestEmpty();
}

TEST_F(EliasFanoCodingTest, Simple) {
  doTestAll<0, 0, uint32_t>();
  doTestAll<0, 0, size_t>();
}

TEST_F(EliasFanoCodingTest, SkipPointers) {
  doTestAll<128, 0, uint32_t>();
  doTestAll<128, 0, size_t>();
}

TEST_F(EliasFanoCodingTest, ForwardPointers) {
  doTestAll<0, 128, uint32_t>();
  doTestAll<0, 128, size_t>();
}

TEST_F(EliasFanoCodingTest, SkipForwardPointers) {
  doTestAll<128, 128, uint32_t>();
  doTestAll<128, 128, size_t>();
}

TEST_F(EliasFanoCodingTest, BugLargeGapInUpperBits) { // t16274876
  typedef EliasFanoEncoderV2<uint32_t, uint32_t, 2, 2> Encoder;
  typedef EliasFanoReader<Encoder, instructions::Default> Reader;
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

  list.free();
}

namespace bm {

typedef EliasFanoEncoderV2<uint32_t, uint32_t, 128, 128> Encoder;

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

} // namespace bm

BENCHMARK(Next, iters) {
  dispatchInstructions([&](auto instructions) {
    bmNext<EliasFanoReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, iters);
  });
}

size_t Skip_ForwardQ128(size_t iters, size_t logAvgSkip) {
  dispatchInstructions([&](auto instructions) {
    bmSkip<EliasFanoReader<bm::Encoder, decltype(instructions)>>(
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
    bmJump<EliasFanoReader<bm::Encoder, decltype(instructions)>>(
        bm::list, bm::data, bm::order, iters);
  });
}

BENCHMARK_DRAW_LINE();

size_t SkipTo_SkipQ128(size_t iters, size_t logAvgSkip) {
  dispatchInstructions([&](auto instructions) {
    bmSkipTo<EliasFanoReader<bm::Encoder, decltype(instructions)>>(
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
    bmJumpTo<EliasFanoReader<bm::Encoder, decltype(instructions)>>(
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
// Intel(R) Xeon(R) CPU E5-2678 v3 @ 2.50GHz (turbo on),
// Using GCC 5 with --bm_min_usec 100000.
V1008 12:29:33.646595 87744 Instructions.h:161] Will use folly::compression::instructions::Haswell
============================================================================
folly/experimental/test/EliasFanoCodingTest.cpp relative  time/iter  iters/s
============================================================================
Next                                                         2.47ns  405.58M
Skip_ForwardQ128(1)                                          6.68ns  149.67M
Skip_ForwardQ128(2)                                          7.67ns  130.30M
Skip_ForwardQ128(4_pm_1)                                     9.12ns  109.65M
Skip_ForwardQ128(16_pm_4)                                    9.95ns  100.53M
Skip_ForwardQ128(64_pm_16)                                  12.76ns   78.40M
Skip_ForwardQ128(256_pm_64)                                 18.09ns   55.27M
Skip_ForwardQ128(1024_pm_256)                               19.13ns   52.28M
Jump_ForwardQ128                                            20.27ns   49.33M
----------------------------------------------------------------------------
SkipTo_SkipQ128(1)                                           8.35ns  119.76M
SkipTo_SkipQ128(2)                                          12.37ns   80.85M
SkipTo_SkipQ128(4_pm_1)                                     15.05ns   66.44M
SkipTo_SkipQ128(16_pm_4)                                    22.90ns   43.66M
SkipTo_SkipQ128(64_pm_16)                                   34.11ns   29.31M
SkipTo_SkipQ128(256_pm_64)                                  38.68ns   25.85M
SkipTo_SkipQ128(1024_pm_256)                                41.75ns   23.95M
JumpTo_SkipQ128                                             44.79ns   22.33M
----------------------------------------------------------------------------
Encode_10                                                  120.33ns    8.31M
Encode                                                       7.61ms   131.32
----------------------------------------------------------------------------
defaultNumLowerBits                                          3.69ns  270.74M
slowDefaultNumLowerBits                                     10.90ns   91.73M
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
