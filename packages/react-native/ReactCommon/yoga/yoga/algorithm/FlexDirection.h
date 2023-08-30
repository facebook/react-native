/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

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

} // namespace facebook::yoga
