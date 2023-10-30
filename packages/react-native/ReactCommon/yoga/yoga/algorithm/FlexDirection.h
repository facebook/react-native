/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/Dimension.h>
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

inline YGEdge flexStartEdge(const FlexDirection flexDirection) {
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

inline YGEdge flexEndEdge(const FlexDirection flexDirection) {
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

inline YGEdge inlineStartEdge(
    const FlexDirection flexDirection,
    const Direction direction) {
  if (isRow(flexDirection)) {
    return direction == Direction::RTL ? YGEdgeRight : YGEdgeLeft;
  }

  return YGEdgeTop;
}

inline YGEdge inlineEndEdge(
    const FlexDirection flexDirection,
    const Direction direction) {
  if (isRow(flexDirection)) {
    return direction == Direction::RTL ? YGEdgeLeft : YGEdgeRight;
  }

  return YGEdgeBottom;
}

/**
 * The physical edges that YGEdgeStart and YGEdgeEnd correspond to (e.g.
 * left/right) are soley dependent on the direction. However, there are cases
 * where we want the flex start/end edge (i.e. which edge is the start/end
 * for laying out flex items), which can be distinct from the corresponding
 * inline edge. In these cases we need to know which "relative edge"
 * (YGEdgeStart/YGEdgeEnd) corresponds to the said flex start/end edge as these
 * relative edges can be used instead of physical ones when defining certain
 * attributes like border or padding.
 */
inline YGEdge flexStartRelativeEdge(
    FlexDirection flexDirection,
    Direction direction) {
  const YGEdge leadLayoutEdge = inlineStartEdge(flexDirection, direction);
  const YGEdge leadFlexItemEdge = flexStartEdge(flexDirection);
  return leadLayoutEdge == leadFlexItemEdge ? YGEdgeStart : YGEdgeEnd;
}

inline YGEdge flexEndRelativeEdge(
    FlexDirection flexDirection,
    Direction direction) {
  const YGEdge trailLayoutEdge = inlineEndEdge(flexDirection, direction);
  const YGEdge trailFlexItemEdge = flexEndEdge(flexDirection);
  return trailLayoutEdge == trailFlexItemEdge ? YGEdgeEnd : YGEdgeStart;
}

inline Dimension dimension(const FlexDirection flexDirection) {
  switch (flexDirection) {
    case FlexDirection::Column:
      return Dimension::Height;
    case FlexDirection::ColumnReverse:
      return Dimension::Height;
    case FlexDirection::Row:
      return Dimension::Width;
    case FlexDirection::RowReverse:
      return Dimension::Width;
  }

  fatalWithMessage("Invalid FlexDirection");
}

} // namespace facebook::yoga
