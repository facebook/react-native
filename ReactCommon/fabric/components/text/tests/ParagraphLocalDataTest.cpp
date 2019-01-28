/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/attributedstring/primitives.h>
#include <react/components/text/ParagraphLocalData.h>
#include <react/components/text/conversions.h>

namespace facebook {
namespace react {

TEST(ParagraphLocalDataTest, testSomething) {
  auto attString = AttributedString();
  auto fragment = AttributedString::Fragment();
  fragment.string = "test";

  auto text = TextAttributes();
  text.foregroundColor = {
      colorFromComponents({100 / 255.0, 153 / 255.0, 253 / 255.0, 1.0})};
  text.opacity = 0.5;
  text.fontStyle = FontStyle::Italic;
  text.fontWeight = FontWeight::Thin;
  text.fontVariant = FontVariant::TabularNums;
  fragment.textAttributes = text;
  attString.prependFragment(fragment);

  auto paragraphLocalData = ParagraphLocalData();
  paragraphLocalData.setAttributedString(attString);

  auto result = toDynamic(paragraphLocalData)["attributedString"];

  assert(result["string"] == fragment.string);
  auto textAttribute = result["fragments"][0]["textAttributes"];
  assert(textAttribute["foregroundColor"] == toDynamic(text.foregroundColor));
  assert(textAttribute["opacity"] == text.opacity);
  assert(textAttribute["fontStyle"] == toString(*text.fontStyle));
  assert(textAttribute["fontWeight"] == toString(*text.fontWeight));
}

} // namespace react
} // namespace facebook
