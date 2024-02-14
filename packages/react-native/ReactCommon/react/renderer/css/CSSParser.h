/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSKeywords.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSTokenizer.h>
#include <react/renderer/css/CSSValue.h>
#include <react/utils/PackTraits.h>

namespace facebook::react {

namespace detail {
class CSSParser {
 public:
  explicit constexpr CSSParser(std::string_view css)
      : tokenizer_{css}, currentToken_(tokenizer_.next()) {}

  template <CSSKeywordSet KeywordT, CSSBasicDataType... AllowedTypesT>
  constexpr CSSValueVariant<KeywordT, AllowedTypesT...>
  consumeComponentValue() {
    using CSSValueT = CSSValueVariant<KeywordT, AllowedTypesT...>;
    switch (peek().type()) {
      case CSSTokenType::Ident:
        if (auto keywordValue = consumeIdentToken<CSSValueT, KeywordT>()) {
          return *keywordValue;
        }
        break;
      case CSSTokenType::Dimension:
        if (auto dimensionValue =
                consumeDimensionToken<CSSValueT, AllowedTypesT...>()) {
          return *dimensionValue;
        }
        break;
      case CSSTokenType::Percentage:
        if (auto percentageValue =
                consumePercentageToken<CSSValueT, AllowedTypesT...>()) {
          return *percentageValue;
        }
        break;
      case CSSTokenType::Number:
        if (auto numberValue =
                consumeNumberToken<CSSValueT, AllowedTypesT...>()) {
          return *numberValue;
        }
        break;
      default:
        break;
    }

    consumeToken();
    return {};
  }

  constexpr void consumeWhitespace() {
    while (peek().type() == CSSTokenType::WhiteSpace) {
      consumeToken();
    }
  }

  constexpr bool hasMoreTokens() const {
    return peek().type() != CSSTokenType::EndOfFile;
  }

 private:
  constexpr const CSSToken& peek() const {
    return currentToken_;
  }

  constexpr CSSToken consumeToken() {
    auto prevToken = currentToken_;
    currentToken_ = tokenizer_.next();
    return prevToken;
  }

  template <typename CSSValueT, CSSKeywordSet KeywordT>
  constexpr std::optional<CSSValueT> consumeIdentToken() {
    if (auto keyword =
            parseCSSKeyword<KeywordT>(consumeToken().stringValue())) {
      return CSSValueT::keyword(*keyword);
    }
    return {};
  }

  template <typename CSSValueT, CSSBasicDataType... AllowedTypesT>
  constexpr std::optional<CSSValueT> consumeDimensionToken() {
    if constexpr (traits::containsType<CSSLength, AllowedTypesT...>()) {
      if (auto unit = parseCSSLengthUnit(peek().unit())) {
        return CSSValueT::length(consumeToken().numericValue(), *unit);
      }
    }
    return {};
  }

  template <typename CSSValueT, CSSBasicDataType... AllowedTypesT>
  constexpr std::optional<CSSValueT> consumePercentageToken() {
    if constexpr (traits::containsType<CSSPercentage, AllowedTypesT...>()) {
      return CSSValueT::percentage(consumeToken().numericValue());
    }
    return {};
  }

  template <typename CSSValueT, CSSBasicDataType... AllowedTypesT>
  constexpr std::optional<CSSValueT> consumeNumberToken() {
    // <ratio> = <number [0,∞]> [ / <number [0,∞]> ]?
    // https://www.w3.org/TR/css-values-4/#ratio
    if constexpr (traits::containsType<CSSRatio, AllowedTypesT...>()) {
      if (isValidRatioPart(peek().numericValue())) {
        float numerator = consumeToken().numericValue();
        float denominator = 1.0;

        consumeWhitespace();
        if (peek().type() != CSSTokenType::Ident &&
            peek().stringValue() == "/") {
          consumeToken();
          consumeWhitespace();

          if (peek().type() == CSSTokenType::Number &&
              isValidRatioPart(peek().numericValue())) {
            denominator = consumeToken().numericValue();
          } else {
            return CSSValueT{};
          }
        }

        return CSSValueT::ratio(numerator, denominator);
      }
    }

    if constexpr (traits::containsType<CSSNumber, AllowedTypesT...>()) {
      return CSSValueT::number(consumeToken().numericValue());
    }

    // For zero lengths the unit identifier is optional (i.e. can be
    // syntactically represented as the <number> 0). However, if a 0 could
    // be parsed as either a <number> or a <length> in a property (such as
    // line-height), it must parse as a <number>.
    // https://www.w3.org/TR/css-values-4/#lengths
    if constexpr (traits::containsType<CSSLength, AllowedTypesT...>()) {
      if (peek().numericValue() == 0) {
        return CSSValueT::length(
            consumeToken().numericValue(), CSSLengthUnit::Px);
      }
    }

    return {};
  }

  static constexpr bool isValidRatioPart(float value) {
    // If either number in the <ratio> is 0 or infinite, it represents a
    // degenerate ratio (and, generally, won’t do anything).
    // https://www.w3.org/TR/css-values-4/#ratios
    return value > 0.0f && value != +std::numeric_limits<float>::infinity() &&
        value != -std::numeric_limits<float>::infinity();
  }

  CSSTokenizer tokenizer_;
  CSSToken currentToken_;
};

} // namespace detail

/*
 * Parse a single CSS component value as a keyword constrained to those
 * allowable by KeywordRepresentationT. Returns a default-constructed
 * CSSValueVariant (KeywordT::Unset) on syntax error.
 *
 * https://www.w3.org/TR/css-syntax-3/#parse-component-value
 */
template <CSSKeywordSet KeywordT, CSSBasicDataType... AllowedTypesT>
constexpr CSSValueVariant<KeywordT, AllowedTypesT...> parseCSSComponentValue(
    std::string_view css) {
  detail::CSSParser parser(css);

  parser.consumeWhitespace();
  auto value = parser.consumeComponentValue<KeywordT, AllowedTypesT...>();
  parser.consumeWhitespace();

  if (parser.hasMoreTokens()) {
    return {};
  } else {
    return value;
  }
}

} // namespace facebook::react
