/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Utils.h"

YGFlexDirection YGFlexDirectionCross(
    const YGFlexDirection flexDirection,
    const YGDirection direction) {
  return YGFlexDirectionIsColumn(flexDirection)
      ? YGResolveFlexDirection(YGFlexDirectionRow, direction)
      : YGFlexDirectionColumn;
}

float YGFloatMax(const float a, const float b) {
  if (!YGFloatIsUndefined(a) && !YGFloatIsUndefined(b)) {
    return fmaxf(a, b);
  }
  return YGFloatIsUndefined(a) ? b : a;
}

float YGFloatMin(const float a, const float b) {
  if (!YGFloatIsUndefined(a) && !YGFloatIsUndefined(b)) {
    return fminf(a, b);
  }

  return YGFloatIsUndefined(a) ? b : a;
}

bool YGValueEqual(const YGValue a, const YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == YGUnitUndefined ||
      (YGFloatIsUndefined(a.value) && YGFloatIsUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool YGFloatsEqual(const float a, const float b) {
  if (!YGFloatIsUndefined(a) && !YGFloatIsUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return YGFloatIsUndefined(a) && YGFloatIsUndefined(b);
}

float YGFloatSanitize(const float& val) {
  return YGFloatIsUndefined(val) ? 0 : val;
}
