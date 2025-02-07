/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <memory>
#include <optional>

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/css/CSSZero.h>
#include <react/utils/iequals.h>

namespace facebook::react {

/**
 * Representation of matrix() transform function.
 */
struct CSSMatrix {
  std::array<float, 6> values{};

  constexpr bool operator==(const CSSMatrix& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSMatrix> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSMatrix> {
    if (!iequals(func.name, "matrix")) {
      return {};
    }

    CSSMatrix matrix{};
    for (int i = 0; i < 6; i++) {
      auto value = parseNextCSSValue<CSSNumber>(
          parser, i == 0 ? CSSDelimiter::None : CSSDelimiter::Comma);
      if (std::holds_alternative<std::monostate>(value)) {
        return {};
      }
      matrix.values[i] = std::get<CSSNumber>(value).value;
    }

    return matrix;
  }
};

static_assert(CSSDataType<CSSMatrix>);

/**
 * Representation of translate() transform function.
 */
struct CSSTranslate {
  std::variant<CSSLength, CSSPercentage> x{};
  std::variant<CSSLength, CSSPercentage> y{};

  constexpr bool operator==(const CSSTranslate& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslate> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSTranslate> {
    if (!iequals(func.name, "translate")) {
      return {};
    }

    auto x = parseNextCSSValue<CSSLengthPercentage>(parser);
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y =
        parseNextCSSValue<CSSLengthPercentage>(parser, CSSDelimiter::Comma);

    CSSTranslate translate{};
    translate.x = std::holds_alternative<CSSLength>(x)
        ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(x)}
        : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(x)};

    if (!std::holds_alternative<std::monostate>(y)) {
      translate.y = std::holds_alternative<CSSLength>(y)
          ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(y)}
          : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(y)};
    }

    return translate;
  }
};

static_assert(CSSDataType<CSSTranslate>);

/**
 * Representation of translate() transform function.
 */
struct CSSTranslate3D {
  std::variant<CSSLength, CSSPercentage> x{};
  std::variant<CSSLength, CSSPercentage> y{};
  CSSLength z{};

  constexpr bool operator==(const CSSTranslate3D& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslate3D> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSTranslate3D> {
    if (!iequals(func.name, "translate3d")) {
      return {};
    }

    auto x = parseNextCSSValue<CSSLengthPercentage>(parser);
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y =
        parseNextCSSValue<CSSLengthPercentage>(parser, CSSDelimiter::Comma);
    if (std::holds_alternative<std::monostate>(y)) {
      return {};
    }

    auto z = parseNextCSSValue<CSSLength>(parser, CSSDelimiter::Comma);
    if (std::holds_alternative<std::monostate>(z)) {
      return {};
    }

    return CSSTranslate3D{
        .x = std::holds_alternative<CSSLength>(x)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(x)}
            : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(
                  x)},
        .y = std::holds_alternative<CSSLength>(y)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(y)}
            : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(
                  y)},
        .z = std::get<CSSLength>(z),
    };
  }
};

static_assert(CSSDataType<CSSTranslate3D>);

/**
 * Representation of translateX() transform function.
 */
struct CSSTranslateX {
  std::variant<CSSLength, CSSPercentage> value{};

  constexpr bool operator==(const CSSTranslateX& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslateX> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSTranslateX> {
    if (!iequals(func.name, "translateX")) {
      return {};
    }

    auto val = parseNextCSSValue<CSSLengthPercentage>(parser);
    if (std::holds_alternative<std::monostate>(val)) {
      return {};
    }

    return CSSTranslateX{
        .value = std::holds_alternative<CSSLength>(val)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(val)}
            : std::variant<CSSLength, CSSPercentage>{
                  std::get<CSSPercentage>(val)}};
  }
};

static_assert(CSSDataType<CSSTranslateX>);

/**
 * Representation of translateY() transform function.
 */
struct CSSTranslateY {
  std::variant<CSSLength, CSSPercentage> value{};

  constexpr bool operator==(const CSSTranslateY& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslateY> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSTranslateY> {
    if (!iequals(func.name, "translateY")) {
      return {};
    }

    auto val = parseNextCSSValue<CSSLengthPercentage>(parser);
    if (std::holds_alternative<std::monostate>(val)) {
      return {};
    }

    return CSSTranslateY{
        .value = std::holds_alternative<CSSLength>(val)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(val)}
            : std::variant<CSSLength, CSSPercentage>{
                  std::get<CSSPercentage>(val)}};
  }
};

static_assert(CSSDataType<CSSTranslateY>);

/**
 * Representation of scale() transform function.
 */
struct CSSScale {
  float x{};
  float y{};

  constexpr bool operator==(const CSSScale& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScale> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSScale> {
    if (!iequals(func.name, "scale")) {
      return {};
    }

    // Transforms module level 2 allows percentage syntax
    // https://drafts.csswg.org/css-transforms-2/#transform-functions
    auto x = parseNextCSSValue<CSSNumber, CSSPercentage>(parser);
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y = parseNextCSSValue<CSSNumber, CSSPercentage>(
        parser, CSSDelimiter::Comma);

    auto normX = std::holds_alternative<CSSNumber>(x)
        ? std::get<CSSNumber>(x).value
        : std::get<CSSPercentage>(x).value / 100.0f;

    auto normY = std::holds_alternative<std::monostate>(y) ? normX
        : std::holds_alternative<CSSNumber>(y)
        ? std::get<CSSNumber>(y).value
        : std::get<CSSPercentage>(y).value / 100.0f;

    return CSSScale{normX, normY};
  }
};

static_assert(CSSDataType<CSSScale>);

/**
 * Representation of scaleX() transform function.
 */
struct CSSScaleX {
  float value{};

  constexpr bool operator==(const CSSScaleX& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScaleX> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSScaleX> {
    if (!iequals(func.name, "scaleX")) {
      return {};
    }

    auto x = parseNextCSSValue<CSSNumber, CSSPercentage>(parser);
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    return CSSScaleX{
        .value = std::holds_alternative<CSSNumber>(x)
            ? std::get<CSSNumber>(x).value
            : std::get<CSSPercentage>(x).value / 100.0f};
  }
};

static_assert(CSSDataType<CSSScaleX>);

/**
 * Representation of scaleY() transform function.
 */
struct CSSScaleY {
  float value{};

  constexpr bool operator==(const CSSScaleY& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScaleY> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSScaleY> {
    if (!iequals(func.name, "scaleY")) {
      return {};
    }

    auto y = parseNextCSSValue<CSSNumber, CSSPercentage>(parser);
    if (std::holds_alternative<std::monostate>(y)) {
      return {};
    }

    return CSSScaleY{
        .value = std::holds_alternative<CSSNumber>(y)
            ? std::get<CSSNumber>(y).value
            : std::get<CSSPercentage>(y).value / 100.0f};
  }
};

static_assert(CSSDataType<CSSScaleY>);

/**
 * Representation of rotate() or rotateZ() transform function.
 */
struct CSSRotateZ {
  float degrees{};

  constexpr bool operator==(const CSSRotateZ& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateZ> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSRotateZ> {
    if (!(iequals(func.name, "rotate") || iequals(func.name, "rotateZ"))) {
      return {};
    }

    auto value = parseNextCSSValue<CSSAngle, CSSZero>(parser);
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return CSSRotateZ{
        .degrees = std::holds_alternative<CSSAngle>(value)
            ? std::get<CSSAngle>(value).degrees
            : 0.0f,

    };
  }
};

static_assert(CSSDataType<CSSRotateZ>);

/**
 * Representation of rotateX() transform function.
 */
struct CSSRotateX {
  float degrees{};

  constexpr bool operator==(const CSSRotateX& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateX> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSRotateX> {
    if (!iequals(func.name, "rotateX")) {
      return {};
    }

    auto value = parseNextCSSValue<CSSAngle, CSSZero>(parser);
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return CSSRotateX{
        .degrees = std::holds_alternative<CSSAngle>(value)
            ? std::get<CSSAngle>(value).degrees
            : 0.0f,
    };
  }
};

static_assert(CSSDataType<CSSRotateX>);

/**
 * Representation of rotateY() transform function.
 */
struct CSSRotateY {
  float degrees{};

  constexpr bool operator==(const CSSRotateY& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateY> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSRotateY> {
    if (!iequals(func.name, "rotateY")) {
      return {};
    }

    auto value = parseNextCSSValue<CSSAngle, CSSZero>(parser);
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return CSSRotateY{
        .degrees = std::holds_alternative<CSSAngle>(value)
            ? std::get<CSSAngle>(value).degrees
            : 0.0f,
    };
  }
};

static_assert(CSSDataType<CSSRotateY>);

/**
 * Representation of skewX() transform function.
 */
struct CSSSkewX {
  float degrees{};

  constexpr bool operator==(const CSSSkewX& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSkewX> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSSkewX> {
    if (!iequals(func.name, "skewX")) {
      return {};
    }

    auto value = parseNextCSSValue<CSSAngle, CSSZero>(parser);
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return CSSSkewX{
        .degrees = std::holds_alternative<CSSAngle>(value)
            ? std::get<CSSAngle>(value).degrees
            : 0.0f,
    };
  }
};

static_assert(CSSDataType<CSSSkewX>);

/**
 * Representation of skewY() transform function.
 */
struct CSSSkewY {
  float degrees{};

  constexpr bool operator==(const CSSSkewY& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSkewY> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSSkewY> {
    if (!iequals(func.name, "skewY")) {
      return {};
    }

    auto value = parseNextCSSValue<CSSAngle, CSSZero>(parser);
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return CSSSkewY{
        .degrees = std::holds_alternative<CSSAngle>(value)
            ? std::get<CSSAngle>(value).degrees
            : 0.0f,
    };
  }
};

static_assert(CSSDataType<CSSSkewY>);

/**
 * Representation of perspective() transform function.
 */
struct CSSPerspective {
  CSSLength length{};

  constexpr bool operator==(const CSSPerspective& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSPerspective> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& parser) -> std::optional<CSSPerspective> {
    if (!iequals(func.name, "perspective")) {
      return {};
    }

    auto value = parseNextCSSValue<CSSLength>(parser);
    if (std::holds_alternative<std::monostate>(value) ||
        std::get<CSSLength>(value).value < 0) {
      return {};
    }

    return CSSPerspective{
        .length = std::get<CSSLength>(value),
    };
  }
};

static_assert(CSSDataType<CSSPerspective>);

/**
 * Represents one of the <transform-function> types supported by react-native.
 * https://drafts.csswg.org/css-transforms-2/#transform-functions
 */
using CSSTransformFunction = CSSCompoundDataType<
    CSSMatrix,
    CSSTranslate,
    CSSTranslateX,
    CSSTranslateY,
    CSSTranslate3D,
    CSSScale,
    CSSScaleX,
    CSSScaleY,
    CSSRotateZ, // same as rotate()
    CSSRotateX,
    CSSRotateY,
    CSSSkewX,
    CSSSkewY,
    CSSPerspective>;

/**
 * Represents the <transform-list> type.
 * https://drafts.csswg.org/css-transforms-1/#typedef-transform-list
 */
using CSSTransformList = CSSWhitespaceSeparatedList<CSSTransformFunction>;

} // namespace facebook::react
