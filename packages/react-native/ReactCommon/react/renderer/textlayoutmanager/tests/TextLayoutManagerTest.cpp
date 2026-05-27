/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

using namespace facebook::react;

TEST(TextLayoutManagerTest, defaultTextAttributesAreLayoutEquivalent) {
  TextAttributes lhs;
  TextAttributes rhs;

  EXPECT_TRUE(areTextAttributesEquivalentLayoutWise(lhs, rhs));
  EXPECT_EQ(
      textAttributesHashLayoutWise(lhs), textAttributesHashLayoutWise(rhs));
}

TEST(TextLayoutManagerTest, maxFontSizeMultiplierAffectsLayoutCacheEquality) {
  TextAttributes lhs;
  TextAttributes rhs;

  lhs.fontSize = rhs.fontSize = 16;
  lhs.fontSizeMultiplier = rhs.fontSizeMultiplier = 2;
  lhs.maxFontSizeMultiplier = 1;
  rhs.maxFontSizeMultiplier = 2;

  EXPECT_FALSE(areTextAttributesEquivalentLayoutWise(lhs, rhs));
}

TEST(TextLayoutManagerTest, maxFontSizeMultiplierAffectsLayoutCacheHash) {
  TextAttributes lhs;
  TextAttributes rhs;

  lhs.fontSize = rhs.fontSize = 16;
  lhs.fontSizeMultiplier = rhs.fontSizeMultiplier = 2;
  lhs.maxFontSizeMultiplier = 1;
  rhs.maxFontSizeMultiplier = 2;

  EXPECT_NE(
      textAttributesHashLayoutWise(lhs), textAttributesHashLayoutWise(rhs));
}
