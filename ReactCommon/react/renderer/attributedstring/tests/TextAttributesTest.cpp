/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

#ifdef ANDROID

TEST(TextAttributesTest, testToDynamic) {
  auto textAttributes = TextAttributes{};
  textAttributes.foregroundColor = {
      colorFromComponents({200 / 255.0, 153 / 255.0, 100 / 255.0, 1.0})};
  textAttributes.opacity = 0.5;
  textAttributes.fontStyle = FontStyle::Italic;
  textAttributes.fontWeight = FontWeight::Thin;
  textAttributes.fontVariant = FontVariant::TabularNums;

  auto result = toDynamic(textAttributes);
  EXPECT_EQ(
      result["foregroundColor"], toDynamic(textAttributes.foregroundColor));
  EXPECT_EQ(result["opacity"], textAttributes.opacity);
  EXPECT_EQ(result["fontStyle"], toString(textAttributes.fontStyle.value()));
  EXPECT_EQ(result["fontWeight"], toString(textAttributes.fontWeight.value()));
}

#endif

} // namespace react
} // namespace facebook
