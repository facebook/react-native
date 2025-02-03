/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

struct ConsumeDataType {
  float number{};

  constexpr bool operator==(const ConsumeDataType& other) const = default;
};

template <>
struct CSSDataTypeParser<ConsumeDataType> {
  constexpr static std::optional<ConsumeDataType> consume(
      CSSSyntaxParser& parser) {
    auto val = parseNextCSSValue<CSSNumber>(parser);
    if (std::holds_alternative<CSSNumber>(val)) {
      return ConsumeDataType{std::get<CSSNumber>(val).value};
    }

    return {};
  }
};

static_assert(CSSDataType<ConsumeDataType>);

TEST(CSSValueParser, consume_multiple_with_delimeter) {
  CSSSyntaxParser parser{"1 2, 3, 4 / 5"};

  auto next = parseNextCSSValue<ConsumeDataType>(parser);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 1);

  next = parseNextCSSValue<ConsumeDataType>(parser, CSSDelimiter::None);
  EXPECT_FALSE(std::holds_alternative<ConsumeDataType>(next));

  next = parseNextCSSValue<ConsumeDataType>(parser, CSSDelimiter::Whitespace);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 2);

  next = parseNextCSSValue<ConsumeDataType>(parser, CSSDelimiter::Comma);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 3);

  next = parseNextCSSValue<ConsumeDataType>(parser, CSSDelimiter::Comma);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 4);

  next = parseNextCSSValue<ConsumeDataType>(parser, CSSDelimiter::Solidus);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 5);

  next = parseNextCSSValue<ConsumeDataType>(parser);
  EXPECT_FALSE(std::holds_alternative<ConsumeDataType>(next));
}

} // namespace facebook::react
