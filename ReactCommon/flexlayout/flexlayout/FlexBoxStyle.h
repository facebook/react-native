/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include "Dimension.h"
#include "FlexLayoutEnums.h"
#include "FlexLayoutMacros.h"

#ifdef DEBUG
#include <iosfwd>
#endif

namespace facebook {
namespace flexlayout {
namespace style {

using namespace facebook::flexlayout::utils;

class FLEX_LAYOUT_EXPORT FlexBoxStyle {
 private:
  std::array<Dimension, 4> padding = {};
  std::array<Dimension, 4> border = {};

 public:
  Direction direction : 2;
  FlexDirection flexDirection : 2;
  JustifyContent justifyContent : 3;
  AlignContent alignContent : 3;
  AlignItems alignItems : 3;
  FlexWrap flexWrap : 2;
  Overflow overflow : 2;

  FlexBoxStyle() {
    direction = Direction::Inherit;
    justifyContent = JustifyContent::FlexStart;
    flexWrap = FlexWrap::NoWrap;
    overflow = Overflow::Visible;
    alignContent = AlignContent::Stretch;
    alignItems = AlignItems::Stretch;
    flexDirection = FlexDirection::Row;
  }

  // https://www.w3.org/TR/css-flexbox-1/#axis-mapping
  auto mainAxis() const -> FlexDirection {
    switch (direction) {
      case Direction::RTL:
        switch (flexDirection) {
          case FlexDirection::Row:
            return FlexDirection::RowReverse;
          case FlexDirection::RowReverse:
            return FlexDirection::Row;
          case FlexDirection::Column:
          case FlexDirection::ColumnReverse:
            return flexDirection;
        }
      case Direction::Inherit:
      case Direction::LTR:
        return flexDirection;
    }
  }

  // https://www.w3.org/TR/css-flexbox-1/#axis-mapping
  auto crossAxis() const -> FlexDirection {
    switch (mainAxis()) {
      case FlexDirection::Row:
      case FlexDirection::RowReverse:
        return FlexDirection::Column;
      case FlexDirection::Column:
      case FlexDirection::ColumnReverse:
        return direction == Direction::RTL ? FlexDirection::RowReverse
                                           : FlexDirection::Row;
    }
  }

  auto getPadding(Edge edge) const -> Dimension {
    return padding[static_cast<size_t>(edge)];
  }

  void setPadding(Edge edge, Float value) {
    padding[static_cast<size_t>(edge)] = Dimension(value, Unit::Point);
  }

  void setPaddingPercent(Edge edge, Float value) {
    padding[static_cast<size_t>(edge)] = Dimension(value, Unit::Percent);
  }

  auto getBorder(Edge edge) const -> Dimension {
    return border[static_cast<size_t>(edge)];
  }

  void setBorder(Edge edge, Float value) {
    border[static_cast<size_t>(edge)] = Dimension(value, Unit::Point);
  }

  auto getPaddingAndBorder(Edge edge, Float ownerWidth) const -> Float;

  float pointScaleFactor = 1;
};

#ifdef DEBUG
auto operator<<(std::ostream& os, const FlexBoxStyle& style) -> std::ostream&;
#endif
} // namespace style
} // namespace flexlayout
} // namespace facebook
