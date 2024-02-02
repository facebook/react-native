/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <string_view>
#include <type_traits>

#include <react/utils/fnv1a.h>

namespace facebook::react {

#pragma pack(push, 1)

/**
 * Represents a CSS component value type.
 * https://www.w3.org/TR/css-values-3/#component-types
 */
enum class CSSValueType : uint8_t {
  Undefined,
  Keyword,
  Length,
  Number,
  Percent,
};

/**
 * One of the predefined CSS keywords.
 * https://www.w3.org/TR/css-values-3/#keywords
 */
enum class CSSKeyword : uint8_t {
  Absolute,
  Auto,
  Baseline,
  Center,
  Column,
  ColumnReverse,
  Flex,
  FlexEnd,
  FlexStart,
  Hidden,
  Inherit,
  Inline,
  Ltr,
  None,
  NoWrap,
  Relative,
  Row,
  RowReverse,
  Rtl,
  Scroll,
  SpaceAround,
  SpaceBetween,
  SpaceEvenly,
  Static,
  Stretch,
  Visible,
  Wrap,
  WrapReverse,
};

/**
 * Unit for the CSS <length> type.
 * https://www.w3.org/TR/css-values-3/#lengths
 */
enum class CSSLengthUnit : uint8_t {
  Px,
};

/**
 * CSS <length> value.
 * https://www.w3.org/TR/css-values-3/#lengths
 */
struct CSSLength {
  float value;
  CSSLengthUnit unit;
};

static_assert(std::is_trivial_v<CSSLength>);

/**
 * CSS <percent> value.
 * https://www.w3.org/TR/css-values-3/#percentages
 */
struct CSSPercent {
  float value;
};
static_assert(std::is_trivial_v<CSSPercent>);

/**
 * CSS <number> value.
 * https://www.w3.org/TR/css-values-3/#numbers
 */
struct CSSNumber {
  float value;
};
static_assert(std::is_trivial_v<CSSNumber>);

/**
 * Represents a CSS property value of an arbitrary type
 */
struct CSSValue {
  CSSValueType type{CSSValueType::Undefined};
  union {
    CSSKeyword keyword;
    CSSLength length;
    CSSNumber number;
    CSSPercent percent;
  };
};
static_assert(sizeof(CSSValue) == 6, "CSSValue must be tightly packed");

/*
 *  Represents a CSS property value accepting a keyword
 */
struct CSSKeywordValue {
  CSSValueType type{CSSValueType::Undefined};
  union {
    CSSKeyword keyword;
  };
};
static_assert(
    sizeof(CSSKeywordValue) == 2,
    "CSSKeywordValue must be tightly packed");

/*
 *  Represents a CSS property value accepting a <length>
 */
struct CSSLengthValue {
  CSSValueType type{CSSValueType::Undefined};
  union {
    CSSKeyword keyword;
    CSSLength length;
  };
};
static_assert(
    sizeof(CSSLengthValue) == 6,
    "CSSLengthValue must be tightly packed");

/*
 * Represents a CSS property value accepting a <length-percentage>
 */
struct CSSLengthPercentageValue {
  CSSValueType type{CSSValueType::Undefined};
  union {
    CSSKeyword keyword;
    CSSLength length;
    CSSPercent percent;
  };
};
static_assert(
    sizeof(CSSLengthPercentageValue) == 6,
    "CSSLengthPercentageValue must be tightly packed");

/*
 *  Represents a CSS property value accepting a <length>
 */
struct CSSNumberValue {
  CSSValueType type{CSSValueType::Undefined};
  union {
    CSSKeyword keyword;
    CSSNumber number;
  };
};
static_assert(
    sizeof(CSSNumberValue) == 5,
    "CSSNumberValue must be tightly packed");

#pragma pack(pop)

} // namespace facebook::react
