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

#include <folly/Checksum.h>


#include <folly/Benchmark.h>
#include <folly/Hash.h>
#include <folly/detail/ChecksumDetail.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

namespace {
const unsigned int BUFFER_SIZE = 512 * 1024 * sizeof(uint64_t);
uint8_t buffer[BUFFER_SIZE];

struct ExpectedResult {
  size_t offset;
  size_t length;
  uint32_t crc32c;
};

ExpectedResult expectedResults[] = {
    // Zero-byte input
    { 0, 0, ~0U },
    // Small aligned inputs to test special cases in SIMD implementations
    { 8, 1, 1543413366 },
    { 8, 2, 523493126 },
    { 8, 3, 1560427360 },
    { 8, 4, 3422504776 },
    { 8, 5, 447841138 },
    { 8, 6, 3910050499 },
    { 8, 7, 3346241981 },
    // Small unaligned inputs
    { 9, 1, 3855826643 },
    { 10, 2, 560880875 },
    { 11, 3, 1479707779 },
    { 12, 4, 2237687071 },
    { 13, 5, 4063855784 },
    { 14, 6, 2553454047 },
    { 15, 7, 1349220140 },
    // Larger inputs to test leftover chunks at the end of aligned blocks
    { 8, 8, 627613930 },
    { 8, 9, 2105929409 },
    { 8, 10, 2447068514 },
    { 8, 11, 863807079 },
    { 8, 12, 292050879 },
    { 8, 13, 1411837737 },
    { 8, 14, 2614515001 },
    { 8, 15, 3579076296 },
    { 8, 16, 2897079161 },
    { 8, 17, 675168386 },
    // Much larger inputs
    { 0, BUFFER_SIZE, 2096790750 },
    { 1, BUFFER_SIZE / 2, 3854797577 },
};

void testCRC32C(
    std::function<uint32_t(const uint8_t*, size_t, uint32_t)> impl) {
  for (auto expected : expectedResults) {
    uint32_t result = impl(buffer + expected.offset, expected.length, ~0U);
    EXPECT_EQ(expected.crc32c, result);
  }
}

void testCRC32CContinuation(
    std::function<uint32_t(const uint8_t*, size_t, uint32_t)> impl) {
  for (auto expected : expectedResults) {
    size_t partialLength = expected.length / 2;
    uint32_t partialChecksum = impl(
        buffer + expected.offset, partialLength, ~0U);
    uint32_t result = impl(
        buffer + expected.offset + partialLength,
        expected.length - partialLength, partialChecksum);
    EXPECT_EQ(expected.crc32c, result);
  }
}

} // namespace

TEST(Checksum, crc32c_software) {
  testCRC32C(folly::detail::crc32c_sw);
}

TEST(Checksum, crc32c_continuation_software) {
  testCRC32CContinuation(folly::detail::crc32c_sw);
}


TEST(Checksum, crc32c_hardware) {
  if (folly::detail::crc32c_hw_supported()) {
    testCRC32C(folly::detail::crc32c_hw);
  } else {
    LOG(WARNING) << "skipping hardware-accelerated CRC-32C tests" <<
        " (not supported on this CPU)";
  }
}

TEST(Checksum, crc32c_continuation_hardware) {
  if (folly::detail::crc32c_hw_supported()) {
    testCRC32CContinuation(folly::detail::crc32c_hw);
  } else {
    LOG(WARNING) << "skipping hardware-accelerated CRC-32C tests" <<
        " (not supported on this CPU)";
  }
}

TEST(Checksum, crc32c_autodetect) {
  testCRC32C(folly::crc32c);
}

TEST(Checksum, crc32c_continuation_autodetect) {
  testCRC32CContinuation(folly::crc32c);
}

void benchmarkHardwareCRC32C(unsigned long iters, size_t blockSize) {
  if (folly::detail::crc32c_hw_supported()) {
    uint32_t checksum;
    for (unsigned long i = 0; i < iters; i++) {
      checksum = folly::detail::crc32c_hw(buffer, blockSize);
      folly::doNotOptimizeAway(checksum);
    }
  } else {
    LOG(WARNING) << "skipping hardware-accelerated CRC-32C benchmarks" <<
        " (not supported on this CPU)";
  }
}

void benchmarkSoftwareCRC32C(unsigned long iters, size_t blockSize) {
  uint32_t checksum;
  for (unsigned long i = 0; i < iters; i++) {
    checksum = folly::detail::crc32c_sw(buffer, blockSize);
    folly::doNotOptimizeAway(checksum);
  }
}

// This test fits easily in the L1 cache on modern server processors,
// and thus it mainly measures the speed of the checksum computation.
BENCHMARK(crc32c_hardware_1KB_block, iters) {
  benchmarkHardwareCRC32C(iters, 1024);
}

BENCHMARK(crc32c_software_1KB_block, iters) {
  benchmarkSoftwareCRC32C(iters, 1024);
}

BENCHMARK_DRAW_LINE();

// This test is too big for the L1 cache but fits in L2
BENCHMARK(crc32c_hardware_64KB_block, iters) {
  benchmarkHardwareCRC32C(iters, 64 * 1024);
}

BENCHMARK(crc32c_software_64KB_block, iters) {
  benchmarkSoftwareCRC32C(iters, 64 * 1024);
}

BENCHMARK_DRAW_LINE();

// This test is too big for the L2 cache but fits in L3
BENCHMARK(crc32c_hardware_512KB_block, iters) {
  benchmarkHardwareCRC32C(iters, 512 * 1024);
}

BENCHMARK(crc32c_software_512KB_block, iters) {
  benchmarkSoftwareCRC32C(iters, 512 * 1024);
}


int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  // Populate a buffer with a deterministic pattern
  // on which to compute checksums
  const uint8_t* src = buffer;
  uint64_t* dst = (uint64_t*)buffer;
  const uint64_t* end = (const uint64_t*)(buffer + BUFFER_SIZE);
  *dst++ = 0;
  while (dst < end) {
    *dst++ = folly::hash::fnv64_buf((const char*)src, sizeof(uint64_t));
    src += sizeof(uint64_t);
  }

  auto ret = RUN_ALL_TESTS();
  if (!ret && FLAGS_benchmark) {
    folly::runBenchmarks();
  }
  return ret;
}
