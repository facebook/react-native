/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/utils/fnv1a.h>

namespace facebook::react {

TEST(fnv1aTests, testBasicHashing) {
  EXPECT_EQ(fnv1a("react"), fnv1a("react"));

  EXPECT_NE(fnv1a("react"), fnv1a("tceat"));

  auto string1 = "case 1";
  auto string2 = "different string";
  EXPECT_EQ(fnv1a(string1), fnv1a(string1));
  EXPECT_NE(fnv1a(string1), fnv1a(string2));
}

} // namespace facebook::react
