/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/CompactValue.h>

namespace facebook::yoga {

inline FloatOptional resolveValue(const YGValue value, const float ownerSize) {
  switch (value.unit) {
    case YGUnitPoint:
      return FloatOptional{value.value};
    case YGUnitPercent:
      return FloatOptional{value.value * ownerSize * 0.01f};
    default:
      return FloatOptional{};
  }
}

inline FloatOptional resolveValue(CompactValue value, float ownerSize) {
  return resolveValue((YGValue)value, ownerSize);
}

} // namespace facebook::yoga
