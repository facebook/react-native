/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <cstdint>
#include <optional>
#include <string_view>

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSSyntaxParser.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/fnv1a.h>

namespace facebook::react {

namespace detail {

constexpr uint8_t clamp255Component(float f) {
  // Implementations should honor the precision of the channel as authored or
  // calculated wherever possible. If this is not possible, the channel should
  // be rounded towards +∞.
  // https://www.w3.org/TR/css-color-4/#rgb-functions
  auto i = static_cast<int32_t>(f);
  auto ceiled = f > i ? i + 1 : i;
  return static_cast<uint8_t>(std::clamp(ceiled, 0, 255));
}

/**
 * Parses an rgb() or rgba() function and returns a CSSColor if it is valid.
 * Some invalid syntax (like mixing commas and whitespace) are allowed for
 * backwards compatibility with normalize-color.
 * https://www.w3.org/TR/css-color-4/#funcdef-rgb
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseRgbFunction(CSSSyntaxParser& parser) {
  auto firstValue = parseNextCSSValue<CSSNumber, CSSPercentage>(parser);
  if (std::holds_alternative<std::monostate>(firstValue)) {
    return {};
  }

  float redNumber = 0;
  float greenNumber = 0;
  float blueNumber = 0;

  if (std::holds_alternative<CSSNumber>(firstValue)) {
    redNumber = std::get<CSSNumber>(firstValue).value;

    auto green =
        parseNextCSSValue<CSSNumber>(parser, CSSDelimiter::CommaOrWhitespace);
    if (!std::holds_alternative<CSSNumber>(green)) {
      return {};
    }
    greenNumber = std::get<CSSNumber>(green).value;

    auto blue =
        parseNextCSSValue<CSSNumber>(parser, CSSDelimiter::CommaOrWhitespace);
    if (!std::holds_alternative<CSSNumber>(blue)) {
      return {};
    }
    blueNumber = std::get<CSSNumber>(blue).value;
  } else {
    redNumber = std::get<CSSPercentage>(firstValue).value * 2.55f;

    auto green = parseNextCSSValue<CSSPercentage>(
        parser, CSSDelimiter::CommaOrWhitespace);
    if (!std::holds_alternative<CSSPercentage>(green)) {
      return {};
    }
    greenNumber = std::get<CSSPercentage>(green).value * 2.55f;

    auto blue = parseNextCSSValue<CSSPercentage>(
        parser, CSSDelimiter::CommaOrWhitespace);
    if (!std::holds_alternative<CSSPercentage>(blue)) {
      return {};
    }
    blueNumber = std::get<CSSPercentage>(blue).value * 2.55f;
  }

  auto alphaValue = parseNextCSSValue<CSSNumber, CSSPercentage>(
      parser, CSSDelimiter::CommaOrWhitespaceOrSolidus);

  float alphaNumber = std::holds_alternative<std::monostate>(alphaValue) ? 1.0f
      : std::holds_alternative<CSSNumber>(alphaValue)
      ? std::get<CSSNumber>(alphaValue).value
      : std::get<CSSPercentage>(alphaValue).value / 100.0f;

  return CSSColor{
      .r = clamp255Component(redNumber),
      .g = clamp255Component(greenNumber),
      .b = clamp255Component(blueNumber),
      .a = clamp255Component(alphaNumber * 255.0f),
  };
}
} // namespace detail

/**
 * Parses a CSS <color-function> value from function name and contents and
 * returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-color-function
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseCSSColorFunction(
    std::string_view colorFunction,
    CSSSyntaxParser& parser) {
  switch (fnv1aLowercase(colorFunction)) {
    // CSS Color Module Level 4 treats the alpha variants of functions as the
    // same as non-alpha variants (alpha is optional for both).
    case fnv1a("rgb"):
    case fnv1a("rgba"):
      return detail::parseRgbFunction<CSSColor>(parser);
      break;
    case fnv1a("hsl"):
    case fnv1a("hsla"):
      // TODO
      break;
    case fnv1a("hwb"):
    case fnv1a("hwba"):
      // TODO
      break;
    case fnv1a("lab"):
      break;
    case fnv1a("lch"):
      break;
    case fnv1a("oklab"):
      break;
    case fnv1a("oklch"):
      break;
    case fnv1a("color"):
      // TODO T213000437: Support `color()` functions and wide-gamut colors.
      break;
    default:
      return {};
  }

  return {};
}

} // namespace facebook::react
