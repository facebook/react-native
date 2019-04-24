/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/experimental/Select64.h>

#include <cstddef>
#include <cstdint>

#include <folly/experimental/Instructions.h>
#include <folly/portability/GTest.h>

// for disassembling
extern "C" uint64_t check_select64_default(uint64_t x, uint64_t k) {
  return folly::select64<folly::compression::instructions::Default>(x, k);
}
extern "C" uint64_t check_select64_haswell(uint64_t x, uint64_t k) {
  return folly::select64<folly::compression::instructions::Haswell>(x, k);
}

class Select64Test : public testing::Test {};

using TestArch = folly::compression::instructions::Default;

TEST_F(Select64Test, SelectInByteTable) {
  for (size_t i = 0u; i < 256u; ++i) {
    uint8_t decoded = 0;
    for (size_t j = 0u; j < 8u; ++j) {
      auto const entry = folly::detail::kSelectInByte[j][i];
      decoded |= uint8_t(entry != 8) << entry;
    }
    EXPECT_EQ(i, decoded);
  }
}

TEST_F(Select64Test, Select64) {
  using instr = TestArch;
  constexpr uint64_t kPrime = uint64_t(-59);
  for (uint64_t x = kPrime, i = 0; i < (1 << 20); x *= kPrime, i += 1) {
    auto const w = instr::popcount(x);
    for (size_t k = 0; k < w; ++k) {
      auto const pos = folly::select64<instr>(x, k);
      CHECK_EQ((x >> pos) & 1, 1);
      CHECK_EQ(instr::popcount(x & ((uint64_t(1) << pos) - 1)), k);
    }
  }
}
