/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <type_traits>

#include <react/renderer/css/CSSKeywords.h>
#include <react/renderer/css/CSSLengthUnit.h>

namespace facebook::react {

/**
 * Represents a CSS component value type.
 * https://www.w3.org/TR/css-values-4/#component-types
 */
enum class CSSValueType : uint8_t {
  CSSWideKeyword,
  Keyword,
  Length,
  Number,
  Percentage,
  Ratio,
  Angle,
  Color,
};

/**
 * Concrete representation for a CSS basic data type, or keywords
 * https://www.w3.org/TR/css-values-4/#component-types
 */
template <typename T>
concept CSSDataType = std::is_trivially_destructible_v<T> &&
    std::is_copy_constructible_v<T> && std::is_default_constructible_v<T>;

#pragma pack(push, 1)
/**
 * Representation of CSS <length> data type
 * https://www.w3.org/TR/css-values-4/#lengths
 */
struct CSSLength {
  float value{};
  CSSLengthUnit unit{CSSLengthUnit::Px};
};
#pragma pack(pop)

/**
 * Representation of CSS <percentage> data type
 * https://www.w3.org/TR/css-values-4/#percentages
 */
struct CSSPercentage {
  float value{};
};

/**
 * Representation of CSS <number> data type
 * https://www.w3.org/TR/css-values-4/#numbers
 */
struct CSSNumber {
  float value{};
};

/**
 * Representation of CSS <ratio> data type
 * https://www.w3.org/TR/css-values-4/#ratios
 */
struct CSSRatio {
  float numerator{};
  float denominator{};
};

/**
 * Representation of CSS <angle> data type
 * https://www.w3.org/TR/css-values-4/#angles
 */
struct CSSAngle {
  float degrees{};
};

struct CSSColor {
  uint8_t r{};
  uint8_t g{};
  uint8_t b{};
  uint8_t a{};
};

} // namespace facebook::react
