/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/attributedstring/conversions.h>
#include <react/attributedstring/primitives.h>

namespace facebook {
namespace react {

TEST(ParagraphAttributesTest, testToDynamic) {
  auto paragraphAttributes = ParagraphAttributes();
  paragraphAttributes.maximumNumberOfLines = 2;
  paragraphAttributes.adjustsFontSizeToFit = false;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;
  paragraphAttributes.minimumFontSize = 10;
  paragraphAttributes.maximumFontSize = 20;

  auto result = toDynamic(paragraphAttributes);
  assert(
      result["maximumNumberOfLines"] ==
      paragraphAttributes.maximumNumberOfLines);
  assert(
      result["adjustsFontSizeToFit"] ==
      paragraphAttributes.adjustsFontSizeToFit);
  assert(
      result["ellipsizeMode"] == toString(paragraphAttributes.ellipsizeMode));
  assert(result["minimumFontSize"] == paragraphAttributes.minimumFontSize);
  assert(result["maximumFontSize"] == paragraphAttributes.maximumFontSize);
}

} // namespace react
} // namespace facebook
