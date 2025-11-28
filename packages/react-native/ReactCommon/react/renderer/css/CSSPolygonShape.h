/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <utility>
#include <variant>
#include <vector>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/iequals.h>

namespace facebook::react {

enum class CSSFillRule : uint8_t {
  NonZero,
  EvenOdd,
};

template <>
struct CSSDataTypeParser<CSSFillRule> {
  static auto consumePreservedToken(const CSSPreservedToken &token) -> std::optional<CSSFillRule>
  {
    if (token.type() == CSSTokenType::Ident) {
      auto lowercase = fnv1aLowercase(token.stringValue());
      if (lowercase == fnv1a("nonzero")) {
        return CSSFillRule::NonZero;
      } else if (lowercase == fnv1a("evenodd")) {
        return CSSFillRule::EvenOdd;
      }
    }
    return {};
  }
};

static_assert(CSSDataType<CSSFillRule>);

struct CSSPolygonShape {
  std::vector<std::pair<std::variant<CSSLength, CSSPercentage>, std::variant<CSSLength, CSSPercentage>>> points;
  std::optional<CSSFillRule> fillRule;

  bool operator==(const CSSPolygonShape &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSPolygonShape> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSSyntaxParser &parser)
      -> std::optional<CSSPolygonShape>
  {
    if (!iequals(func.name, "polygon")) {
      return {};
    }

    CSSPolygonShape shape;

    auto firstValue = parseNextCSSValue<CSSFillRule>(parser);
    if (std::holds_alternative<CSSFillRule>(firstValue)) {
      shape.fillRule = std::get<CSSFillRule>(firstValue);
      parser.consumeDelimiter(CSSDelimiter::Comma);
      parser.consumeWhitespace();
    }

    do {
      auto x = parseNextCSSValue<CSSLengthPercentage>(parser);
      if (std::holds_alternative<std::monostate>(x)) {
        break;
      }

      parser.consumeWhitespace();

      auto y = parseNextCSSValue<CSSLengthPercentage>(parser);
      if (std::holds_alternative<std::monostate>(y)) {
        return {};
      }

      std::variant<CSSLength, CSSPercentage> xValue;
      std::variant<CSSLength, CSSPercentage> yValue;

      if (std::holds_alternative<CSSLength>(x)) {
        xValue = std::get<CSSLength>(x);
      } else if (std::holds_alternative<CSSPercentage>(x)) {
        xValue = std::get<CSSPercentage>(x);
      }

      if (std::holds_alternative<CSSLength>(y)) {
        yValue = std::get<CSSLength>(y);
      } else if (std::holds_alternative<CSSPercentage>(y)) {
        yValue = std::get<CSSPercentage>(y);
      }

      shape.points.emplace_back(xValue, yValue);
    } while (parser.consumeDelimiter(CSSDelimiter::Comma));

    if (shape.points.size() < 3) {
      return {};
    }

    return shape;
  }
};

static_assert(CSSDataType<CSSPolygonShape>);

} // namespace facebook::react
