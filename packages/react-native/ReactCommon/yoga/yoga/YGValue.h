/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

YG_EXTERN_C_BEGIN

typedef struct YGValue {
  float value;
  YGUnit unit;
} YGValue;

YG_EXPORT extern const YGValue YGValueAuto;
YG_EXPORT extern const YGValue YGValueUndefined;
YG_EXPORT extern const YGValue YGValueZero;

YG_EXTERN_C_END

#ifdef __cplusplus
#include <limits>
constexpr float YGUndefined = std::numeric_limits<float>::quiet_NaN();
#else
#include <math.h>
#define YGUndefined NAN
#endif

#ifdef __cplusplus
inline bool operator==(const YGValue& lhs, const YGValue& rhs) {
  if (lhs.unit != rhs.unit) {
    return false;
  }

  switch (lhs.unit) {
    case YGUnitUndefined:
    case YGUnitAuto:
      return true;
    case YGUnitPoint:
    case YGUnitPercent:
      return lhs.value == rhs.value;
  }

  return false;
}

inline bool operator!=(const YGValue& lhs, const YGValue& rhs) {
  return !(lhs == rhs);
}

inline YGValue operator-(const YGValue& value) {
  return {-value.value, value.unit};
}
#endif
