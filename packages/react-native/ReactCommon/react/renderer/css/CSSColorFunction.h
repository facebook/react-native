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
#include <react/utils/PackTraits.h>
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

constexpr std::optional<float> normalizeNumberComponent(
    const std::variant<std::monostate, CSSNumber>& component) {
  if (std::holds_alternative<CSSNumber>(component)) {
    return std::get<CSSNumber>(component).value;
  }

  return {};
}

template <typename... ComponentT>
  requires(
      (std::is_same_v<CSSNumber, ComponentT> ||
       std::is_same_v<CSSPercentage, ComponentT>) &&
      ...)
constexpr std::optional<float> normalizeComponent(
    const std::variant<std::monostate, ComponentT...>& component,
    float baseValue) {
  if constexpr (traits::containsType<CSSPercentage, ComponentT...>()) {
    if (std::holds_alternative<CSSPercentage>(component)) {
      return std::get<CSSPercentage>(component).value / 100.0f * baseValue;
    }
  }

  if constexpr (traits::containsType<CSSNumber, ComponentT...>()) {
    if (std::holds_alternative<CSSNumber>(component)) {
      return std::get<CSSNumber>(component).value;
    }
  }

  return {};
}

template <CSSDataType... FirstComponentAllowedTypesT>
constexpr bool isLegacyColorFunction(CSSSyntaxParser& parser) {
  auto lookahead = parser;
  auto next = parseNextCSSValue<FirstComponentAllowedTypesT...>(lookahead);
  if (std::holds_alternative<std::monostate>(next)) {
    return false;
  }

  return lookahead.consumeComponentValue<bool>(
      CSSDelimiter::OptionalWhitespace, [](CSSPreservedToken token) {
        return token.type() == CSSTokenType::Comma;
      });
}

/**
 * Parses a legacy syntax rgb() or rgba() function and returns a CSSColor if it
 * is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-legacy-rgb-syntax
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseLegacyRgbFunction(
    CSSSyntaxParser& parser) {
  auto rawRed = parseNextCSSValue<CSSNumber, CSSPercentage>(parser);
  bool usesNumber = std::holds_alternative<CSSNumber>(rawRed);

  auto red = normalizeComponent(rawRed, 255.0f);
  if (!red.has_value()) {
    return {};
  }

  auto green = usesNumber
      ? normalizeNumberComponent(
            parseNextCSSValue<CSSNumber>(parser, CSSDelimiter::Comma))
      : normalizeComponent(
            parseNextCSSValue<CSSPercentage>(parser, CSSDelimiter::Comma),
            255.0f);
  if (!green.has_value()) {
    return {};
  }

  auto blue = usesNumber
      ? normalizeNumberComponent(
            parseNextCSSValue<CSSNumber>(parser, CSSDelimiter::Comma))
      : normalizeComponent(
            parseNextCSSValue<CSSPercentage>(parser, CSSDelimiter::Comma),
            255.0f);
  if (!blue.has_value()) {
    return {};
  }

  auto alpha = normalizeComponent(
      parseNextCSSValue<CSSNumber, CSSPercentage>(parser, CSSDelimiter::Comma),
      1.0f);

  return CSSColor{
      .r = clamp255Component(*red),
      .g = clamp255Component(*green),
      .b = clamp255Component(*blue),
      .a = alpha.has_value() ? clamp255Component(*alpha * 255.0f)
                             : static_cast<uint8_t>(255u),
  };
}

/**
 * Parses a modern syntax rgb() or rgba() function and returns a CSSColor if it
 * is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-modern-rgb-syntax
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseModernRgbFunction(
    CSSSyntaxParser& parser) {
  auto red = normalizeComponent(
      parseNextCSSValue<CSSNumber, CSSPercentage>(parser), 255.0f);
  if (!red.has_value()) {
    return {};
  }

  auto green = normalizeComponent(
      parseNextCSSValue<CSSNumber, CSSPercentage>(
          parser, CSSDelimiter::Whitespace),
      255.0f);
  if (!green.has_value()) {
    return {};
  }

  auto blue = normalizeComponent(
      parseNextCSSValue<CSSNumber, CSSPercentage>(
          parser, CSSDelimiter::Whitespace),
      255.0f);
  if (!blue.has_value()) {
    return {};
  }

  auto alpha = normalizeComponent(
      parseNextCSSValue<CSSNumber, CSSPercentage>(
          parser, CSSDelimiter::SolidusOrWhitespace),
      1.0f);

  return CSSColor{
      .r = clamp255Component(*red),
      .g = clamp255Component(*green),
      .b = clamp255Component(*blue),
      .a = alpha.has_value() ? clamp255Component(*alpha * 255.0f)
                             : static_cast<uint8_t>(255u),
  };
}

/**
 * Parses an rgb() or rgba() function and returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#funcdef-rgb
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseRgbFunction(CSSSyntaxParser& parser) {
  if (isLegacyColorFunction<CSSNumber, CSSPercentage>(parser)) {
    return parseLegacyRgbFunction<CSSColor>(parser);
  } else {
    return parseModernRgbFunction<CSSColor>(parser);
  }
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
