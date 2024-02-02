/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <locale>

#include <react/renderer/components/view/CSSParser.h>
#include <react/renderer/components/view/CSSTokenizer.h>

namespace facebook::react {

static std::optional<CSSKeyword> parseKeyword(std::string_view keyword) {
  struct LowerCaseTransform {
    char operator()(char c) const {
      return static_cast<char>(tolower(c));
    }
  };

  switch (fnv1a<LowerCaseTransform>(keyword)) {
    case fnv1a("absolute"):
      return CSSKeyword::Absolute;
    case fnv1a("auto"):
      return CSSKeyword::Auto;
    case fnv1a("baseline"):
      return CSSKeyword::Baseline;
    case fnv1a("center"):
      return CSSKeyword::Center;
    case fnv1a("column"):
      return CSSKeyword::Column;
    case fnv1a("column-reverse"):
      return CSSKeyword::ColumnReverse;
    case fnv1a("flex"):
      return CSSKeyword::Flex;
    case fnv1a("flex-end"):
      return CSSKeyword::FlexEnd;
    case fnv1a("flex-start"):
      return CSSKeyword::FlexStart;
    case fnv1a("hidden"):
      return CSSKeyword::Hidden;
    case fnv1a("inherit"):
      return CSSKeyword::Inherit;
    case fnv1a("inline"):
      return CSSKeyword::Inline;
    case fnv1a("ltr"):
      return CSSKeyword::Ltr;
    case fnv1a("none"):
      return CSSKeyword::None;
    case fnv1a("no-wrap"):
      return CSSKeyword::NoWrap;
    case fnv1a("relative"):
      return CSSKeyword::Relative;
    case fnv1a("row"):
      return CSSKeyword::Row;
    case fnv1a("row-reverse"):
      return CSSKeyword::RowReverse;
    case fnv1a("rtl"):
      return CSSKeyword::Rtl;
    case fnv1a("space-between"):
      return CSSKeyword::SpaceBetween;
    case fnv1a("space-around"):
      return CSSKeyword::SpaceAround;
    case fnv1a("space-evenly"):
      return CSSKeyword::SpaceEvenly;
    case fnv1a("scroll"):
      return CSSKeyword::Scroll;
    case fnv1a("static"):
      return CSSKeyword::Static;
    case fnv1a("stretch"):
      return CSSKeyword::Stretch;
    case fnv1a("visible"):
      return CSSKeyword::Visible;
    case fnv1a("wrap"):
      return CSSKeyword::Wrap;
    case fnv1a("wrap-reverse"):
      return CSSKeyword::WrapReverse;
    default:
      return std::nullopt;
  }
};

static std::optional<CSSLengthUnit> parseLengthUnit(std::string_view unit) {
  return unit == "px" ? std::make_optional(CSSLengthUnit::Px) : std::nullopt;
}

template <typename T, typename CSSValueT>
concept CSSTokenConsumer = requires(T t, CSSToken token) {
  { t(token) } -> std::same_as<CSSValueT>;
};

template <typename CSSValueT, CSSTokenConsumer<CSSValueT> TokenConsumer>
CSSValueT parseComponentValue(std::string_view css, TokenConsumer consumer) {
  CSSTokenizer tokenizer(css);

  auto token = tokenizer.next();
  while (token.type() == CSSTokenType::WhiteSpace) {
    token = tokenizer.next();
  }

  auto value = consumer(token);

  token = tokenizer.next();
  while (token.type() == CSSTokenType::WhiteSpace) {
    token = tokenizer.next();
  }
  if (token.type() == CSSTokenType::EndOfFile) {
    return value;
  }

  return {};
}

template <>
CSSKeywordValue parseCSSValue<CSSKeywordValue>(std::string_view css) {
  return parseComponentValue<CSSKeywordValue>(css, [](const CSSToken& token) {
    if (token.type() == CSSTokenType::Ident) {
      if (auto keyword = parseKeyword(token.stringValue())) {
        return CSSKeywordValue{CSSValueType::Keyword, {.keyword = *keyword}};
      }
    };

    return CSSKeywordValue{};
  });
}

template <>
CSSLengthValue parseCSSValue<CSSLengthValue>(std::string_view css) {
  return parseComponentValue<CSSLengthValue>(css, [](const CSSToken& token) {
    switch (token.type()) {
      case CSSTokenType::Ident:
        if (auto keyword = parseKeyword(token.stringValue())) {
          return CSSLengthValue{CSSValueType::Keyword, {.keyword = *keyword}};
        }
        break;
      case CSSTokenType::Dimension:
        if (auto unit = parseLengthUnit(token.unit())) {
          return CSSLengthValue{
              CSSValueType::Length, {.length = {token.numericValue(), *unit}}};
        }
        break;
      default:
        break;
    }

    return CSSLengthValue{};
  });
}

template <>
CSSLengthPercentageValue parseCSSValue<CSSLengthPercentageValue>(
    std::string_view css) {
  return parseComponentValue<CSSLengthPercentageValue>(
      css, [](const CSSToken& token) {
        switch (token.type()) {
          case CSSTokenType::Ident:
            if (auto keyword = parseKeyword(token.stringValue())) {
              return CSSLengthPercentageValue{
                  CSSValueType::Keyword, {.keyword = *keyword}};
            }
            break;
          case CSSTokenType::Dimension:
            if (auto unit = parseLengthUnit(token.unit())) {
              return CSSLengthPercentageValue{
                  CSSValueType::Length,
                  {.length = {token.numericValue(), *unit}}};
            }
            break;
          case CSSTokenType::Percent:
            return CSSLengthPercentageValue{
                CSSValueType::Percent, {.percent = {token.numericValue()}}};
            break;
          default:
            break;
        }

        return CSSLengthPercentageValue{};
      });
}

template <>
CSSNumberValue parseCSSValue<CSSNumberValue>(std::string_view css) {
  return parseComponentValue<CSSNumberValue>(css, [](const CSSToken& token) {
    switch (token.type()) {
      case CSSTokenType::Ident:
        if (auto keyword = parseKeyword(token.stringValue())) {
          return CSSNumberValue{CSSValueType::Keyword, {.keyword = *keyword}};
        }
        break;
      case CSSTokenType::Number:
        return CSSNumberValue{
            CSSValueType::Number, {.number = {token.numericValue()}}};
        break;
      default:
        break;
    }

    return CSSNumberValue{};
  });
}

} // namespace facebook::react
