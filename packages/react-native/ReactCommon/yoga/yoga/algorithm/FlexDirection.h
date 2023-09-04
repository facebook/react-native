/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/debug/AssertFatal.h>

namespace facebook::yoga {

inline bool isRow(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionRow ||
      flexDirection == YGFlexDirectionRowReverse;
}

inline bool isColumn(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionColumn ||
      flexDirection == YGFlexDirectionColumnReverse;
}

inline YGFlexDirection resolveDirection(
    const YGFlexDirection flexDirection,
    const YGDirection direction) {
  if (direction == YGDirectionRTL) {
    if (flexDirection == YGFlexDirectionRow) {
      return YGFlexDirectionRowReverse;
    } else if (flexDirection == YGFlexDirectionRowReverse) {
      return YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

inline YGFlexDirection resolveCrossDirection(
    const YGFlexDirection flexDirection,
    const YGDirection direction) {
  return isColumn(flexDirection)
      ? resolveDirection(YGFlexDirectionRow, direction)
      : YGFlexDirectionColumn;
}

inline YGEdge leadingEdge(const YGFlexDirection flexDirection) {
  switch (flexDirection) {
    case YGFlexDirectionColumn:
      return YGEdgeTop;
    case YGFlexDirectionColumnReverse:
      return YGEdgeBottom;
    case YGFlexDirectionRow:
      return YGEdgeLeft;
    case YGFlexDirectionRowReverse:
      return YGEdgeRight;
  }

  fatalWithMessage("Invalid YGFlexDirection");
}

inline YGEdge trailingEdge(const YGFlexDirection flexDirection) {
  switch (flexDirection) {
    case YGFlexDirectionColumn:
      return YGEdgeBottom;
    case YGFlexDirectionColumnReverse:
      return YGEdgeTop;
    case YGFlexDirectionRow:
      return YGEdgeRight;
    case YGFlexDirectionRowReverse:
      return YGEdgeLeft;
  }

  fatalWithMessage("Invalid YGFlexDirection");
}

} // namespace facebook::yoga
