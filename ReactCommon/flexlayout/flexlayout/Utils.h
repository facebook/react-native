/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <array>
#include <limits>
#include "Dimension.h"
#include "FlexBoxStyle.h"
#include "FlexLayoutEnums.h"
#include "FlexLayoutMacros.h"

namespace facebook {
namespace flexlayout {

template <typename Result>
struct MeasureOutput {
  Float width;
  Float height;
  Float baseline;
  Result result;

  auto getWidth() const -> Float {
    return width;
  }

  auto getHeight() const -> Float {
    return height;
  }

  template <typename T>
  MeasureOutput(Float aWidth, Float aHeight, T&& result)
      : MeasureOutput(aWidth, aHeight, UNDEFINED, std::forward<T>(result)) {}
  template <typename T>
  MeasureOutput(Float width, Float height, Float baseline, T&& result)
      : width{width},
        height{height},
        baseline{baseline},
        result{std::forward<T>(result)} {}
};

struct Range {
  Float min;
  Float max;
};

namespace utils {

using namespace facebook::flexlayout::style;

inline auto FlexDirectionIsRow(const FlexDirection flexDirection) -> bool {
  return flexDirection == FlexDirection::Row ||
      flexDirection == FlexDirection::RowReverse;
}

inline auto FlexDirectionIsColumn(const FlexDirection flexDirection) -> bool {
  return flexDirection == FlexDirection::Column ||
      flexDirection == FlexDirection::ColumnReverse;
}

FLEX_LAYOUT_EXPORT auto isUndefined(float value) -> bool;

FLEX_LAYOUT_EXPORT auto isUndefined(double value) -> bool;

FLEX_LAYOUT_EXPORT auto isDefined(float value) -> bool;

FLEX_LAYOUT_EXPORT auto isDefined(double value) -> bool;

FLEX_LAYOUT_EXPORT auto FlexLayoutFloatsEqual(float a, float b) -> bool;

FLEX_LAYOUT_EXPORT auto FlexLayoutDoubleEqual(double a, double b) -> bool;

FLEX_LAYOUT_EXPORT auto FlexLayoutFloatMax(float a, float b) -> float;

FLEX_LAYOUT_EXPORT auto FlexLayoutFloatMin(float a, float b) -> float;

inline auto getLeadingEdge(const FlexDirection axis) -> Edge {
  switch (axis) {
    case FlexDirection::Row:
      return Edge::Left;
    case FlexDirection::RowReverse:
      return Edge::Right;
    case FlexDirection::Column:
      return Edge::Top;
    case FlexDirection::ColumnReverse:
      return Edge::Bottom;
    default:
      return Edge::Left;
  }
}

inline auto getTrailingEdge(const FlexDirection axis) -> Edge {
  switch (axis) {
    case FlexDirection::Row:
      return Edge::Right;
    case FlexDirection::RowReverse:
      return Edge::Left;
    case FlexDirection::Column:
      return Edge::Bottom;
    case FlexDirection::ColumnReverse:
      return Edge::Top;
    default:
      return Edge::Right;
  }
}

inline auto ResolveValueMargin(const Dimension value, const float ownerSize)
    -> float {
  return value.unit == Unit::Auto
      ? 0
      : (isUndefined(value.resolve(ownerSize)) ? 0 : value.resolve(ownerSize));
}

inline auto ConstraintMinMax(
    const float value,
    const float minValue,
    const float maxValue) -> float {
  if (isUndefined(value) && isUndefined(minValue) && isUndefined(maxValue)) {
    return value;
  }
  if (isUndefined(value) && isDefined(maxValue)) {
    return maxValue;
  }
  return FlexLayoutFloatMin(
      FlexLayoutFloatMax(
          isUndefined(value) ? 0 : value, isUndefined(minValue) ? 0 : minValue),
      isUndefined(maxValue) ? std::numeric_limits<float>::max() : maxValue);
}

inline auto ConstraintMin(const float value, const float minValue) -> float {
  if (isUndefined(value) && isUndefined(minValue)) {
    return value;
  }
  return FlexLayoutFloatMax(
      isUndefined(value) ? 0 : value, isUndefined(minValue) ? 0 : minValue);
}

inline auto ConstraintMax(const float value, const float maxValue) -> float {
  if (isUndefined(value) && isUndefined(maxValue)) {
    return value;
  }
  return FlexLayoutFloatMin(
      isUndefined(value) ? 0 : value,
      isUndefined(maxValue) ? std::numeric_limits<float>::max() : maxValue);
}

inline auto getLeadingBorder(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  const float border = node.getBorder(getLeadingEdge(axis)).resolve(widthSize);
  return isUndefined(border) ? 0 : border;
}

inline auto getTrailingBorder(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  const float border = node.getBorder(getTrailingEdge(axis)).resolve(widthSize);
  return isUndefined(border) ? 0 : border;
}

inline auto getLeadingPadding(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  const float padding =
      node.getPadding(getLeadingEdge(axis)).resolve(widthSize);
  return isUndefined(padding) ? 0 : padding;
}

inline auto getTrailingPadding(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  const float padding =
      node.getPadding(getTrailingEdge(axis)).resolve(widthSize);
  return isUndefined(padding) ? 0 : padding;
}

inline auto getLeadingPaddingAndBorder(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  const float leadingPaddingAndBorder =
      getLeadingPadding(node, axis, widthSize) +
      getLeadingBorder(node, axis, widthSize);
  return isUndefined(leadingPaddingAndBorder) ? 0 : leadingPaddingAndBorder;
}

inline auto getTrailingPaddingAndBorder(
    const FlexBoxStyle& node,
    const FlexDirection axis,
    const float widthSize) -> float {
  return getTrailingPadding(node, axis, widthSize) +
      getTrailingBorder(node, axis, widthSize);
}

} // namespace utils
} // namespace flexlayout
} // namespace facebook
