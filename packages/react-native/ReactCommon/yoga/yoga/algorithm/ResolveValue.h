/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/YGFloatOptional.h>

namespace facebook::yoga {

inline YGFloatOptional resolveValue(
    const YGValue value,
    const float ownerSize) {
  switch (value.unit) {
    case YGUnitPoint:
      return YGFloatOptional{value.value};
    case YGUnitPercent:
      return YGFloatOptional{value.value * ownerSize * 0.01f};
    default:
      return YGFloatOptional{};
  }
}

inline YGFloatOptional resolveValue(CompactValue value, float ownerSize) {
  return resolveValue((YGValue) value, ownerSize);
}

} // namespace facebook::yoga
