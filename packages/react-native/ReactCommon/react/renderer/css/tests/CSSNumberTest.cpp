/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSNumber, number_values) {
  auto emptyValue = parseCSSProperty<CSSNumber>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto pxValue = parseCSSProperty<CSSNumber>("20px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(pxValue));

  auto numberValue = parseCSSProperty<CSSNumber>("123.456");
  EXPECT_TRUE(std::holds_alternative<CSSNumber>(numberValue));
  EXPECT_EQ(std::get<CSSNumber>(numberValue).value, 123.456f);

  auto exponentValue = parseCSSProperty<CSSNumber>("-1.5E3");
  EXPECT_TRUE(std::holds_alternative<CSSNumber>(exponentValue));
  EXPECT_EQ(std::get<CSSNumber>(exponentValue).value, -1.5E3f);
}

} // namespace facebook::react
