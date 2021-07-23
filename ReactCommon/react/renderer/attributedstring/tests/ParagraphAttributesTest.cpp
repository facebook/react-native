/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>

namespace facebook {
namespace react {

#ifdef ANDROID

TEST(ParagraphAttributesTest, testToDynamic) {
  auto paragraphAttributes = ParagraphAttributes{};
  paragraphAttributes.maximumNumberOfLines = 2;
  paragraphAttributes.adjustsFontSizeToFit = false;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;

  auto result = toDynamic(paragraphAttributes);
  EXPECT_EQ(
      result["maximumNumberOfLines"], paragraphAttributes.maximumNumberOfLines);
  EXPECT_EQ(
      result["adjustsFontSizeToFit"], paragraphAttributes.adjustsFontSizeToFit);
  EXPECT_EQ(
      result["ellipsizeMode"], toString(paragraphAttributes.ellipsizeMode));
}

#endif

} // namespace react
} // namespace facebook
