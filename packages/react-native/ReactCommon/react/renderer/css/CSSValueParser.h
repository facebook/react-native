/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSAngleUnit.h>
#include <react/renderer/css/CSSProperties.h>
#include <react/renderer/css/CSSSyntaxParser.h>
#include <react/renderer/css/CSSValueVariant.h>

namespace facebook::react {

namespace detail {

class CSSValueParser {
 public:
  explicit inline CSSValueParser(std::string_view css)
      : parser_{css}, currentComponentValue_{parser_.consumeComponentValue()} {}

  /*
   * Attempts to parse the characters starting at the current component value
   * into one of the given data types.
   */
  template <CSSDataType... AllowedTypesT>
  inline CSSValueVariant<AllowedTypesT...> consumeValue() {
    using CSSValueT = CSSValueVariant<AllowedTypesT...>;

    if (holdsToken()) {
      switch (peekToken().type()) {
        case CSSTokenType::Ident:
          if (auto keywordValue =
                  consumeIdentToken<CSSValueT, AllowedTypesT...>()) {
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
    }

    if (holdsFunction()) {
      // Function component values not yet supported
    }

    consumeComponentValue();
    return {};
  }

  inline void consumeWhitespace() {
    while (holdsToken() && peekToken().type() == CSSTokenType::WhiteSpace) {
      consumeComponentValue();
    }
  }

  constexpr bool isFinished() const {
    return holdsToken() && peekToken().type() == CSSTokenType::EndOfFile;
  }

 private:
  constexpr const CSSSyntaxParser::ComponentValue& peek() const {
    return currentComponentValue_;
  }

  constexpr bool holdsToken() const {
    return std::holds_alternative<CSSSyntaxParser::PreservedToken>(peek());
  }

  constexpr bool holdsFunction() const {
    return std::holds_alternative<CSSSyntaxParser::Function>(peek());
  }

  constexpr const CSSSyntaxParser::PreservedToken& peekToken() const {
    return std::get<CSSSyntaxParser::PreservedToken>(peek());
  }

  constexpr const CSSSyntaxParser::Function& peekFunction() const {
    return std::get<CSSSyntaxParser::Function>(peek());
  }

  inline CSSSyntaxParser::ComponentValue consumeComponentValue() {
    auto prevComponentValue = std::move(currentComponentValue_);
    currentComponentValue_ = parser_.consumeComponentValue();
    return prevComponentValue;
  }

  inline CSSSyntaxParser::PreservedToken consumeToken() {
    return std::get<CSSSyntaxParser::PreservedToken>(consumeComponentValue());
  }

  inline CSSSyntaxParser::Function consumeFunction() {
    return std::get<CSSSyntaxParser::Function>(consumeComponentValue());
  }

  template <typename CSSValueT, CSSDataType... AllowedTypesT>
  inline std::optional<CSSValueT> consumeIdentToken() {
    if constexpr (!std::is_same_v<typename CSSValueT::Keyword, void>) {
      if (auto keyword = parseCSSKeyword<typename CSSValueT::Keyword>(
              peekToken().stringValue())) {
        consumeComponentValue();
        return CSSValueT::keyword(*keyword);
      }
    }
    if constexpr (traits::containsType<CSSWideKeyword, AllowedTypesT...>()) {
      if (auto keyword =
              parseCSSKeyword<CSSWideKeyword>(peekToken().stringValue())) {
        consumeComponentValue();
        return CSSValueT::cssWideKeyword(*keyword);
      }
    }
    return {};
  }

  template <typename CSSValueT, CSSDataType... AllowedTypesT>
  inline std::optional<CSSValueT> consumeDimensionToken() {
    if constexpr (traits::containsType<CSSLength, AllowedTypesT...>()) {
      if (auto unit = parseCSSLengthUnit(peekToken().unit())) {
        return CSSValueT::length(consumeToken().numericValue(), *unit);
      }
    }
    if constexpr (traits::containsType<CSSAngle, AllowedTypesT...>()) {
      if (auto unit = parseCSSAngleUnit(peekToken().unit())) {
        return CSSValueT::angle(
            canonicalize(consumeToken().numericValue(), *unit));
      }
    }
    return {};
  }

  template <typename CSSValueT, CSSDataType... AllowedTypesT>
  constexpr std::optional<CSSValueT> consumePercentageToken() {
    if constexpr (traits::containsType<CSSPercentage, AllowedTypesT...>()) {
      return CSSValueT::percentage(consumeToken().numericValue());
    }
    return {};
  }

  template <typename CSSValueT, CSSDataType... AllowedTypesT>
  constexpr std::optional<CSSValueT> consumeNumberToken() {
    // <ratio> = <number [0,∞]> [ / <number [0,∞]> ]?
    // https://www.w3.org/TR/css-values-4/#ratio
    if constexpr (traits::containsType<CSSRatio, AllowedTypesT...>()) {
      if (isValidRatioPart(peekToken().numericValue())) {
        float numerator = consumeToken().numericValue();
        float denominator = 1.0;

        consumeWhitespace();

        if (holdsToken() && peekToken().type() == CSSTokenType::Delim &&
            peekToken().stringValue() == "/") {
          consumeToken();
          consumeWhitespace();

          // TODO: for now, we don't support denominator being a function
          // component value. CSS math functions allow substituion though, where
          // this usage is valid.
          if (holdsToken() && peekToken().type() == CSSTokenType::Number &&
              isValidRatioPart(peekToken().numericValue())) {
            denominator = consumeToken().numericValue();
          } else {
            return {};
          }
        }

        return CSSValueT::ratio(numerator, denominator);
      }
    }

    if constexpr (traits::containsType<CSSNumber, AllowedTypesT...>()) {
      return CSSValueT::number(consumeToken().numericValue());
    }

    // For zero lengths the unit identifier is optional (i.e. can be
    // syntactically represented as the <number> 0). However, if a 0
    // could be parsed as either a <number> or a <length> in a
    // property (such as line-height), it must parse as a <number>.
    // https://www.w3.org/TR/css-values-4/#lengths
    if constexpr (traits::containsType<CSSLength, AllowedTypesT...>()) {
      if (peekToken().numericValue() == 0) {
        return CSSValueT::length(
            consumeToken().numericValue(), CSSLengthUnit::Px);
      }
    }

    return {};
  }

  constexpr bool isValidRatioPart(float value) {
    // If either number in the <ratio> is 0 or infinite, it represents a
    // degenerate ratio (and, generally, won’t do anything).
    // https://www.w3.org/TR/css-values-4/#ratios
    return value > 0.0f && value != +std::numeric_limits<float>::infinity() &&
        value != -std::numeric_limits<float>::infinity();
  }

  CSSSyntaxParser parser_;
  CSSSyntaxParser::ComponentValue currentComponentValue_;
};

template <CSSDataType... AllowedTypesT>
inline void parseCSSValue(
    std::string_view css,
    CSSValueVariant<AllowedTypesT...>& value) {
  detail::CSSValueParser parser(css);

  parser.consumeWhitespace();
  auto componentValue = parser.consumeValue<AllowedTypesT...>();
  parser.consumeWhitespace();

  if (parser.isFinished()) {
    value = std::move(componentValue);
  } else {
    value = {};
  }
};

} // namespace detail

/**
 * Parse a single CSS value. Returns a default-constructed
 * CSSValueVariant (CSSKeyword::Unset) on syntax error.
 */
template <CSSDataType... AllowedTypesT>
CSSValueVariant<AllowedTypesT...> parseCSSValue(std::string_view css) {
  CSSValueVariant<AllowedTypesT...> value;
  detail::parseCSSValue<AllowedTypesT...>(css, value);
  return value;
};

/**
 * Parses a CSS property into its declared value type.
 */
template <CSSProp Prop>
constexpr CSSDeclaredValue<Prop> parseCSSProp(std::string_view css) {
  // For now we only allow parsing props composed of a single component value.
  CSSDeclaredValue<Prop> value;
  detail::parseCSSValue(css, value);
  return value;
}

} // namespace facebook::react
