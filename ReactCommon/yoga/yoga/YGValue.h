/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <math.h>
#include "YGEnums.h"
#include "YGMacros.h"

YG_EXTERN_C_BEGIN

// Not defined in MSVC++
#ifndef NAN
static const uint32_t __nan = 0x7fc00000;
#define NAN (*(const float*) __nan)
#endif

#define YGUndefined NAN

typedef struct YGValue {
  float value;
  YGUnit unit;
} YGValue;

YOGA_EXPORT extern const YGValue YGValueAuto;
YOGA_EXPORT extern const YGValue YGValueUndefined;
YOGA_EXPORT extern const YGValue YGValueZero;

YG_EXTERN_C_END

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

namespace facebook {
namespace yoga {
namespace literals {

inline YGValue operator"" _pt(long double value) {
  return YGValue{static_cast<float>(value), YGUnitPoint};
}
inline YGValue operator"" _pt(unsigned long long value) {
  return operator"" _pt(static_cast<long double>(value));
}

inline YGValue operator"" _percent(long double value) {
  return YGValue{static_cast<float>(value), YGUnitPercent};
}
inline YGValue operator"" _percent(unsigned long long value) {
  return operator"" _percent(static_cast<long double>(value));
}

} // namespace literals
} // namespace yoga
} // namespace facebook

#endif
