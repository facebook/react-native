/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

/**
 * Representation of CSS <ratio> data type
 * https://www.w3.org/TR/css-values-4/#ratios
 */
struct CSSRatio {
  float numerator{};
  float denominator{};
};

template <>
struct CSSDataTypeParser<CSSRatio> {
  static constexpr auto consumePreservedToken(
      const CSSPreservedToken& token,
      CSSSyntaxParser& parser) -> std::optional<CSSRatio> {
    // <ratio> = <number [0,∞]> [ / <number [0,∞]> ]?
    // https://www.w3.org/TR/css-values-4/#ratio
    if (isValidRatioPart(token.numericValue())) {
      float numerator = token.numericValue();

      CSSSyntaxParser lookaheadParser{parser};

      auto hasSolidus = lookaheadParser.consumeComponentValue<bool>(
          CSSComponentValueDelimiter::Whitespace,
          [&](const CSSPreservedToken& token) {
            return token.type() == CSSTokenType::Delim &&
                token.stringValue() == "/";
          });

      if (!hasSolidus) {
        parser = lookaheadParser;
        return CSSRatio{numerator, 1.0f};
      }

      auto denominator = parseNextCSSValue<CSSNumber>(
          lookaheadParser, CSSComponentValueDelimiter::Whitespace);

      if (std::holds_alternative<CSSNumber>(denominator) &&
          isValidRatioPart(std::get<CSSNumber>(denominator).value)) {
        parser = lookaheadParser;
        return CSSRatio{numerator, std::get<CSSNumber>(denominator).value};
      }
    }

    return {};
  }

 private:
  static constexpr bool isValidRatioPart(float value) {
    // If either number in the <ratio> is 0 or infinite, it represents a
    // degenerate ratio (and, generally, won’t do anything).
    // https://www.w3.org/TR/css-values-4/#ratios
    return value > 0.0f && value != +std::numeric_limits<float>::infinity() &&
        value != -std::numeric_limits<float>::infinity();
  }
};

static_assert(CSSDataType<CSSRatio>);

} // namespace facebook::react
