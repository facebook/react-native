/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSAngleUnit.h>
#include <react/renderer/css/CSSParser.h>
#include <react/renderer/css/CSSProperties.h>
#include <react/renderer/css/CSSValueVariant.h>

namespace facebook::react {

namespace detail {

class CSSValueParser {
 public:
  explicit inline CSSValueParser(std::string_view css) : parser_(css) {
    next();
  }

  /*
   * Attempts to parse the characters starting at the current component value
   * into one of the given data types.
   */
  template <CSSDataType... AllowedTypesT>
  inline void next(CSSValueVariant<AllowedTypesT...>& value) {
    using CSSValueT = CSSValueVariant<AllowedTypesT...>;
    if (peekIsToken()) {
      switch (peekToken().type()) {
        case CSSTokenType::Ident:
          value = consumeIdentToken<CSSValueT, AllowedTypesT...>().value_or(
              CSSValueT{});
          break;
        case CSSTokenType::Dimension:
          value = consumeDimensionToken<CSSValueT, AllowedTypesT...>().value_or(
              CSSValueT{});
          break;
        case CSSTokenType::Percentage:
          value =
              consumePercentageToken<CSSValueT, AllowedTypesT...>().value_or(
                  CSSValueT{});
          break;
        case CSSTokenType::Number:
          value = consumeNumberToken<CSSValueT, AllowedTypesT...>().value_or(
              CSSValueT{});
          break;
        default:
          value = CSSValueT{};
          break;
      }
    } else {
      // Not yet supported
      value = CSSValueT{};
    }
  }

  inline bool hasNext() const {
    return !peekIsToken() || peekToken().type() != CSSTokenType::EndOfFile;
  }

  inline void consumeWhitespace() {
    while (peekIsToken() && peekToken().type() == CSSTokenType::WhiteSpace) {
      next();
    }
  }

 private:
  inline CSSParser::ComponentValue next() {
    auto prevComponentValue = std::move(currentComponentValue_);
    currentComponentValue_ = parser_.consumeComponentValue();
    return prevComponentValue;
  }

  constexpr const CSSParser::ComponentValue& peek() const {
    return currentComponentValue_;
  }

  constexpr bool peekIsToken() const {
    return std::holds_alternative<CSSToken>(peek());
  }

  constexpr bool peekIsFunction() const {
    return std::holds_alternative<CSSParser::FunctionComponentValue>(peek());
  }

  constexpr const CSSToken& peekToken() const {
    return std::get<CSSToken>(peek());
  }

  inline CSSToken consumeToken() {
    return std::get<CSSToken>(next());
  }

  constexpr const CSSParser::FunctionComponentValue& peekFunction() const {
    return std::get<CSSParser::FunctionComponentValue>(currentComponentValue_);
  }

  template <typename CSSValueT, CSSDataType... AllowedTypesT>
  inline std::optional<CSSValueT> consumeIdentToken() {
    if constexpr (!std::is_same_v<typename CSSValueT::Keyword, void>) {
      if (auto keyword = parseCSSKeyword<typename CSSValueT::Keyword>(
              peekToken().stringValue())) {
        next();
        return CSSValueT::keyword(*keyword);
      }
    }
    if constexpr (traits::containsType<CSSWideKeyword, AllowedTypesT...>()) {
      if (auto keyword =
              parseCSSKeyword<CSSWideKeyword>(peekToken().stringValue())) {
        next();
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

        if (peekIsToken() && peekToken().type() == CSSTokenType::Delim &&
            peekToken().stringValue() == "/") {
          consumeToken();
          consumeWhitespace();

          // TODO: for now, we don't support denominator being a function
          // component value. CSS math functions allow substituion though, where
          // this usage is valid.
          if (peekIsToken() && peekToken().type() == CSSTokenType::Number &&
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

  CSSParser::ComponentValue currentComponentValue_;
  CSSParser parser_;
};

} // namespace detail

template <typename CSSValueT>
CSSValueT parseCSSValueVariant(std::string_view css) {
  detail::CSSValueParser parser{css};
  parser.consumeWhitespace();

  CSSValueT value;
  parser.next(value);
  parser.consumeWhitespace();

  return parser.hasNext() ? CSSValueT{} : value;
};

template <CSSDataType... AllowedTypesT>
CSSValueVariant<AllowedTypesT...> parseCSSValue(std::string_view css) {
  return parseCSSValueVariant<CSSValueVariant<AllowedTypesT...>>(css);
};

template <CSSProp Prop>
CSSDeclaredValue<Prop> parseCSSProp(std::string_view css) {
  // For now we only allow parsing props composed of a single component value.
  return parseCSSValueVariant<CSSDeclaredValue<Prop>>(css);
}

} // namespace facebook::react
