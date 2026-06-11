/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Color.h>

#include <gtest/gtest.h>

TEST(ColorTest, testColorConversion) {
  using namespace facebook::react;
  {
    auto color = colorFromRGBA(255, 0, 15, 17);

    EXPECT_EQ(alphaFromColor(color), 17);
    EXPECT_EQ(redFromColor(color), 255);
    EXPECT_EQ(greenFromColor(color), 0);
    EXPECT_EQ(blueFromColor(color), 15);
  }

  {
    auto color = colorFromComponents(
        {.red = 0.1f, .green = 0.2f, .blue = 0, .alpha = 0.3f});

    EXPECT_EQ(alphaFromColor(color), std::round(255 * 0.3f));
    EXPECT_EQ(redFromColor(color), std::round(255 * 0.1f));
    EXPECT_EQ(greenFromColor(color), 255 * 0.2f);
    EXPECT_EQ(blueFromColor(color), 0.f);

    auto colorComponents = colorComponentsFromColor(color);
    EXPECT_EQ(std::round(colorComponents.alpha * 10) / 10.f, 0.3f);
    EXPECT_EQ(std::round(colorComponents.red * 10) / 10.f, 0.1f);
    EXPECT_EQ(std::round(colorComponents.green * 10) / 10.f, 0.2f);
    EXPECT_EQ(std::round(colorComponents.blue * 10) / 10.f, 0);
  }
}

TEST(ColorTest, testTransparentColorIsNotUndefined) {
  using namespace facebook::react;

  // Default SharedColor should be falsy (undefined)
  SharedColor undefinedColor;
  EXPECT_FALSE(static_cast<bool>(undefinedColor));

  // Transparent color should be truthy (defined)
  auto transparentColor = colorFromRGBA(0, 0, 0, 0);
  EXPECT_TRUE(static_cast<bool>(transparentColor));

  // clearColor() should be truthy (it's an explicitly set transparent color)
  auto clear = clearColor();
  EXPECT_TRUE(static_cast<bool>(clear));

  // Transparent color should not equal undefined color
  EXPECT_NE(transparentColor, undefinedColor);

  // Two undefined colors should be equal
  SharedColor anotherUndefined;
  EXPECT_EQ(undefinedColor, anotherUndefined);

  // Two transparent colors should be equal
  auto anotherTransparent = colorFromRGBA(0, 0, 0, 0);
  EXPECT_EQ(transparentColor, anotherTransparent);
}
