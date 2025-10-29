/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/utils/Uuid.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

using namespace ::testing;

namespace facebook::react {

TEST(UuidTest, TestGenerateRandomUuidString) {
  static constexpr auto kUuidV4Regex =
      "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

  std::string uuid1 = generateRandomUuidString();
  std::string uuid2 = generateRandomUuidString();
  EXPECT_THAT(uuid1, MatchesRegex(kUuidV4Regex));
  EXPECT_THAT(uuid2, MatchesRegex(kUuidV4Regex));
  EXPECT_NE(uuid1, uuid2);
}

} // namespace facebook::react
