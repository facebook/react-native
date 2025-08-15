/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSNumberLength, number_length_values) {
  auto unitlessZeroValue = parseCSSProperty<CSSNumber, CSSLength>("0");
  EXPECT_TRUE(std::holds_alternative<CSSNumber>(unitlessZeroValue));
  EXPECT_EQ(std::get<CSSNumber>(unitlessZeroValue).value, 0.0f);
}

} // namespace facebook::react
