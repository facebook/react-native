/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <type_traits>

#include <react/renderer/css/CSSAngleUnit.h>
#include <react/renderer/css/CSSColorUtils.h>
#include <react/renderer/css/CSSProperties.h>
#include <react/renderer/css/CSSSyntaxParser.h>
#include <react/renderer/css/CSSValueVariant.h>

namespace facebook::react {

namespace detail {

template <CSSDataType... AllowedTypesT>
class CSSValueParser {
  using CSSValue = CSSValueVariant<AllowedTypesT...>;

 public:
  explicit constexpr CSSValueParser(std::string_view css) : parser_{css} {}

  /*
   * Attempts to parse the characters starting at the current component value
   * into one of the given data types.
   */
  constexpr CSSValue consumeValue(
      CSSComponentValueDelimiter delimeter = CSSComponentValueDelimiter::None) {
    return parser_.consumeComponentValue<CSSValue>(
        delimeter, [&](const CSSPreservedToken& token) {
          // CSS-global keywords
          if constexpr (hasType<CSSWideKeyword>()) {
            if (auto cssWideKeyword = consumeCSSWideKeyword(token)) {
              return *cssWideKeyword;
            }
          }
          // Property-specific keywords
          if constexpr (hasType<typename CSSValue::Keyword>()) {
            if (auto keyword = consumeKeyword(token)) {
              return *keyword;
            }
          }
          // <ratio>
          if constexpr (hasType<CSSRatio>()) {
            if (auto ratio = consumeRatio(token)) {
              return *ratio;
            }
          }
          // <number>
          if constexpr (hasType<CSSNumber>()) {
            if (auto number = consumeNumber(token)) {
              return *number;
            }
          }
          // <length>
          if constexpr (hasType<CSSLength>()) {
            if (auto length = consumeLength(token)) {
              return *length;
            }
          }
          // <angle>
          if constexpr (hasType<CSSAngle>()) {
            if (auto angle = consumeAngle(token)) {
              return *angle;
            }
          }
          // <percentage>
          if constexpr (hasType<CSSPercentage>()) {
            if (auto percentage = consumePercentage(token)) {
              return *percentage;
            }
          }
          // <color>
          if constexpr (hasType<CSSColor>()) {
            if (auto colorValue = consumeColorToken(token)) {
              return *colorValue;
            }
          }
          return CSSValue{};
        });
    // TODO: support function component values and simple blocks
  }

  constexpr bool isFinished() const {
    return parser_.isFinished();
  }

  constexpr void consumeWhitespace() {
    parser_.consumeWhitespace();
  }

 private:
  template <CSSDataType T>
  constexpr static bool hasType() {
    return traits::containsType<T, AllowedTypesT...>();
  }

  template <typename T>
  constexpr static bool hasType() {
    return false;
  }

  constexpr std::optional<CSSValue> consumeKeyword(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Ident) {
      if (auto keyword = parseCSSKeyword<typename CSSValue::Keyword>(
              token.stringValue())) {
        return CSSValue::keyword(*keyword);
      }
    }
    return {};
  }

  constexpr std::optional<CSSValue> consumeCSSWideKeyword(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Ident) {
      if (auto keyword = parseCSSKeyword<CSSWideKeyword>(token.stringValue())) {
        return CSSValue::cssWideKeyword(*keyword);
      }
    }
    return {};
  }

  constexpr std::optional<CSSValue> consumeAngle(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Dimension) {
      if (auto unit = parseCSSAngleUnit(token.unit())) {
        return CSSValue::angle(canonicalize(token.numericValue(), *unit));
      }
    }
    return {};
  }

  constexpr std::optional<CSSValue> consumePercentage(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Percentage) {
      return CSSValue::percentage(token.numericValue());
    }

    return {};
  }

  constexpr std::optional<CSSValue> consumeNumber(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Number) {
      return CSSValue::number(token.numericValue());
    }

    return {};
  }

  constexpr std::optional<CSSValue> consumeLength(
      const CSSPreservedToken& token) {
    switch (token.type()) {
      case CSSTokenType::Dimension:
        if (auto unit = parseCSSLengthUnit(token.unit())) {
          return CSSValue::length(token.numericValue(), *unit);
        }
        break;
      case CSSTokenType::Number:
        // For zero lengths the unit identifier is optional (i.e. can be
        // syntactically represented as the <number> 0). However, if a 0
        // could be parsed as either a <number> or a <length> in a
        // property (such as line-height), it must parse as a <number>.
        // https://www.w3.org/TR/css-values-4/#lengths
        if (token.numericValue() == 0) {
          return CSSValue::length(token.numericValue(), CSSLengthUnit::Px);
        }
        break;
      default:
        break;
    }

    return {};
  }

  constexpr std::optional<CSSValue> consumeRatio(
      const CSSPreservedToken& token) {
    // <ratio> = <number [0,∞]> [ / <number [0,∞]> ]?
    // https://www.w3.org/TR/css-values-4/#ratio
    if (isValidRatioPart(token.numericValue())) {
      float numerator = token.numericValue();

      CSSSyntaxParser lookaheadParser{parser_};

      auto hasSolidus = lookaheadParser.consumeComponentValue<bool>(
          CSSComponentValueDelimiter::Whitespace,
          [&](const CSSPreservedToken& token) {
            return token.type() == CSSTokenType::Delim &&
                token.stringValue() == "/";
          });

      if (!hasSolidus) {
        return CSSValue::ratio(numerator, 1.0f);
      }

      // TODO: support math expression substituion for <number>
      auto denominator =
          lookaheadParser.consumeComponentValue<std::optional<float>>(
              CSSComponentValueDelimiter::Whitespace,
              [&](const CSSPreservedToken& token) {
                if (token.type() == CSSTokenType::Number &&
                    isValidRatioPart(token.numericValue())) {
                  return std::optional(token.numericValue());
                }
                return std::optional<float>{};
              });

      if (denominator.has_value()) {
        parser_ = lookaheadParser;
        return CSSValue::ratio(numerator, *denominator);
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

  constexpr std::optional<CSSValue> consumeColorToken(
      const CSSPreservedToken& token) {
    if (token.type() == CSSTokenType::Ident) {
      return parseCSSNamedColor<CSSValue>(token.stringValue());
    } else if (token.type() != CSSTokenType::Hash) {
      return {};
    }

    // https://www.w3.org/TR/css-color-4/#hex-color
    std::string_view hexColorValue = token.stringValue();
    if (isValidHexColor(hexColorValue)) {
      if (hexColorValue.length() == 3) {
        return CSSValue::color(
            hexToNumeric(hexColorValue.substr(0, 1), HexColorType::Short),
            hexToNumeric(hexColorValue.substr(1, 1), HexColorType::Short),
            hexToNumeric(hexColorValue.substr(2, 1), HexColorType::Short),
            255u);
      } else if (hexColorValue.length() == 4) {
        return CSSValue::color(
            hexToNumeric(hexColorValue.substr(0, 1), HexColorType::Short),
            hexToNumeric(hexColorValue.substr(1, 1), HexColorType::Short),
            hexToNumeric(hexColorValue.substr(2, 1), HexColorType::Short),
            hexToNumeric(hexColorValue.substr(3, 1), HexColorType::Short));
      } else if (hexColorValue.length() == 6) {
        return CSSValue::color(
            hexToNumeric(hexColorValue.substr(0, 2), HexColorType::Long),
            hexToNumeric(hexColorValue.substr(2, 2), HexColorType::Long),
            hexToNumeric(hexColorValue.substr(4, 2), HexColorType::Long),
            255u);
      } else if (hexColorValue.length() == 8) {
        return CSSValue::color(
            hexToNumeric(hexColorValue.substr(0, 2), HexColorType::Long),
            hexToNumeric(hexColorValue.substr(2, 2), HexColorType::Long),
            hexToNumeric(hexColorValue.substr(4, 2), HexColorType::Long),
            hexToNumeric(hexColorValue.substr(6, 2), HexColorType::Long));
      }
    }
    return {};
  }

  CSSSyntaxParser parser_;
};

template <CSSDataType... AllowedTypesT>
constexpr void parseCSSValue(
    std::string_view css,
    CSSValueVariant<AllowedTypesT...>& value) {
  detail::CSSValueParser<AllowedTypesT...> parser(css);

  parser.consumeWhitespace();
  auto componentValue = parser.consumeValue();
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
