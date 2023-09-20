/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/FlexDirection.h>

namespace facebook::yoga {

inline bool isRow(const FlexDirection flexDirection) {
  return flexDirection == FlexDirection::Row ||
      flexDirection == FlexDirection::RowReverse;
}

inline bool isColumn(const FlexDirection flexDirection) {
  return flexDirection == FlexDirection::Column ||
      flexDirection == FlexDirection::ColumnReverse;
}

inline FlexDirection resolveDirection(
    const FlexDirection flexDirection,
    const Direction direction) {
  if (direction == Direction::RTL) {
    if (flexDirection == FlexDirection::Row) {
      return FlexDirection::RowReverse;
    } else if (flexDirection == FlexDirection::RowReverse) {
      return FlexDirection::Row;
    }
  }

  return flexDirection;
}

inline FlexDirection resolveCrossDirection(
    const FlexDirection flexDirection,
    const Direction direction) {
  return isColumn(flexDirection)
      ? resolveDirection(FlexDirection::Row, direction)
      : FlexDirection::Column;
}

inline YGEdge leadingEdge(const FlexDirection flexDirection) {
  switch (flexDirection) {
    case FlexDirection::Column:
      return YGEdgeTop;
    case FlexDirection::ColumnReverse:
      return YGEdgeBottom;
    case FlexDirection::Row:
      return YGEdgeLeft;
    case FlexDirection::RowReverse:
      return YGEdgeRight;
  }

  fatalWithMessage("Invalid FlexDirection");
}

inline YGEdge trailingEdge(const FlexDirection flexDirection) {
  switch (flexDirection) {
    case FlexDirection::Column:
      return YGEdgeBottom;
    case FlexDirection::ColumnReverse:
      return YGEdgeTop;
    case FlexDirection::Row:
      return YGEdgeRight;
    case FlexDirection::RowReverse:
      return YGEdgeLeft;
  }

  fatalWithMessage("Invalid FlexDirection");
}

inline YGDimension dimension(const FlexDirection flexDirection) {
  switch (flexDirection) {
    case FlexDirection::Column:
      return YGDimensionHeight;
    case FlexDirection::ColumnReverse:
      return YGDimensionHeight;
    case FlexDirection::Row:
      return YGDimensionWidth;
    case FlexDirection::RowReverse:
      return YGDimensionWidth;
  }

  fatalWithMessage("Invalid FlexDirection");
}

} // namespace facebook::yoga
