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

#include <folly/compression/Counters.h>
#include <folly/compression/Compression.h>
#include <folly/portability/GTest.h>

using ::folly::CompressionCounterType;
using ::folly::detail::CompressionCounter;

namespace {
constexpr auto kCodecType = folly::io::CodecType::USER_DEFINED;
constexpr folly::StringPiece kCodecName = "test";
constexpr auto kKey = folly::CompressionCounterKey::BYTES_AFTER_COMPRESSION;
} // namespace

TEST(FollyCountersTest, HasImplementation) {
  CompressionCounter counter(
      kCodecType, kCodecName, folly::none, kKey, CompressionCounterType::SUM);
  EXPECT_FALSE(counter.hasImplementation());
}

TEST(FollyCountersTest, SumWorks) {
  CompressionCounter counter(
      kCodecType, kCodecName, folly::none, kKey, CompressionCounterType::SUM);
  for (int i = 0; i < 100; ++i) {
    ++counter;
    counter++;
  }
}

TEST(FollyCountersTest, AvgWorks) {
  CompressionCounter counter(
      kCodecType, kCodecName, folly::none, kKey, CompressionCounterType::AVG);
  for (int i = 0; i < 100; ++i) {
    counter += 5;
  }
}
