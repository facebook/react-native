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

#include <folly/Varint.h>

#include <array>
#include <initializer_list>
#include <random>
#include <vector>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/Random.h>
#include <folly/portability/GTest.h>

DEFINE_int32(random_seed, folly::randomNumberSeed(), "random seed");

namespace folly {
namespace test {

void testVarint(uint64_t val, std::initializer_list<uint8_t> bytes) {
  size_t n = bytes.size();
  ByteRange expected(&*bytes.begin(), n);

  {
    uint8_t buf[kMaxVarintLength64];
    EXPECT_EQ(expected.size(), encodeVarint(val, buf));
    EXPECT_TRUE(ByteRange(buf, expected.size()) == expected);
    EXPECT_EQ(expected.size(), encodeVarintSize(val));
  }

  {
    ByteRange r = expected;
    uint64_t decoded = decodeVarint(r);
    EXPECT_TRUE(r.empty());
    EXPECT_EQ(val, decoded);
  }

  if (n < kMaxVarintLength64) {
    // Try from a full buffer too, different code path
    uint8_t buf[kMaxVarintLength64];
    memcpy(buf, &*bytes.begin(), n);

    uint8_t fills[] = {0, 0x7f, 0x80, 0xff};

    for (uint8_t fill : fills) {
      memset(buf + n, fill, kMaxVarintLength64 - n);
      ByteRange r(buf, kMaxVarintLength64);
      uint64_t decoded = decodeVarint(r);
      EXPECT_EQ(val, decoded);
      EXPECT_EQ(kMaxVarintLength64 - n, r.size());
    }
  }
}

TEST(Varint, Interface) {
  // Make sure decodeVarint() accepts all of StringPiece, MutableStringPiece,
  // ByteRange, and MutableByteRange.
  char c = 0;

  StringPiece sp(&c, 1);
  EXPECT_EQ(decodeVarint(sp), 0);

  MutableStringPiece msp(&c, 1);
  EXPECT_EQ(decodeVarint(msp), 0);

  ByteRange br(reinterpret_cast<unsigned char*>(&c), 1);
  EXPECT_EQ(decodeVarint(br), 0);

  MutableByteRange mbr(reinterpret_cast<unsigned char*>(&c), 1);
  EXPECT_EQ(decodeVarint(mbr), 0);
}

TEST(Varint, Simple) {
  testVarint(0, {0});
  testVarint(1, {1});
  testVarint(127, {127});
  testVarint(128, {0x80, 0x01});
  testVarint(300, {0xac, 0x02});
  testVarint(16383, {0xff, 0x7f});
  testVarint(16384, {0x80, 0x80, 0x01});

  testVarint(static_cast<uint32_t>(-1), {0xff, 0xff, 0xff, 0xff, 0x0f});
  testVarint(
      static_cast<uint64_t>(-1),
      {0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01});
}

void testVarintFail(std::initializer_list<uint8_t> bytes) {
  size_t n = bytes.size();
  ByteRange data(&*bytes.begin(), n);
  auto ret = tryDecodeVarint(data);
  EXPECT_FALSE(ret.hasValue());
}

TEST(Varint, Fail) {
  testVarintFail({0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff});
}

TEST(ZigZag, Simple) {
  EXPECT_EQ(0, encodeZigZag(0));
  EXPECT_EQ(1, encodeZigZag(-1));
  EXPECT_EQ(2, encodeZigZag(1));
  EXPECT_EQ(3, encodeZigZag(-2));
  EXPECT_EQ(4, encodeZigZag(2));

  EXPECT_EQ(0, decodeZigZag(0));
  EXPECT_EQ(-1, decodeZigZag(1));
  EXPECT_EQ(1, decodeZigZag(2));
  EXPECT_EQ(-2, decodeZigZag(3));
  EXPECT_EQ(2, decodeZigZag(4));
}

namespace {

constexpr size_t kNumValues = 1000;
std::vector<uint64_t> gValues;
std::vector<uint64_t> gDecodedValues;
std::vector<uint8_t> gEncoded;

void generateRandomValues() {
  LOG(INFO) << "Random seed is " << FLAGS_random_seed;
  std::mt19937 rng(FLAGS_random_seed);

  // Approximation of power law
  std::uniform_int_distribution<int> numBytes(1, 8);
  std::uniform_int_distribution<int> byte(0, 255);

  gValues.resize(kNumValues);
  gDecodedValues.resize(kNumValues);
  gEncoded.resize(kNumValues * kMaxVarintLength64);
  for (size_t i = 0; i < kNumValues; ++i) {
    int n = numBytes(rng);
    uint64_t val = 0;
    for (int j = 0; j < n; ++j) {
      val = (val << 8) + byte(rng);
    }
    gValues[i] = val;
  }
}

// Benchmark results (Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz, Linux x86_64)
//
// I0814 19:13:14.466256  7504 VarintTest.cpp:146] Random seed is -1216518886
// ============================================================================
// folly/test/VarintTest.cpp                       relative  time/iter  iters/s
// ============================================================================
// VarintEncoding                                               6.69us  149.37K
// VarintDecoding                                               6.85us  145.90K
// ============================================================================
//
// Disabling the "fast path" code in decodeVarint hurts performance:
//
// I0814 19:15:13.871467  9550 VarintTest.cpp:156] Random seed is -1216518886
// ============================================================================
// folly/test/VarintTest.cpp                       relative  time/iter  iters/s
// ============================================================================
// VarintEncoding                                               6.75us  148.26K
// VarintDecoding                                              12.60us   79.37K
// ============================================================================

BENCHMARK(VarintEncoding, iters) {
  uint8_t* start = &(*gEncoded.begin());
  uint8_t* p = start;
  while (iters--) {
    p = start;
    for (auto& v : gValues) {
      p += encodeVarint(v, p);
    }
  }

  gEncoded.erase(gEncoded.begin() + (p - start), gEncoded.end());
}

BENCHMARK(VarintDecoding, iters) {
  while (iters--) {
    size_t i = 0;
    ByteRange range(&(*gEncoded.begin()), &(*gEncoded.end()));
    while (!range.empty()) {
      gDecodedValues[i++] = decodeVarint(range);
    }
  }
}

} // namespace
} // namespace test
} // namespace folly

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);
  int ret = RUN_ALL_TESTS();
  if (ret == 0) {
    folly::test::generateRandomValues();
    folly::runBenchmarksOnFlag();
  }
  return ret;
}
