/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/CompactValue.h>

namespace facebook::yoga::value {

/**
 * Canonical unit (one YGUnitPoint)
 */
inline CompactValue points(float value) {
  return CompactValue::of<YGUnitPoint>(value);
}

/**
 * Percent of reference
 */
inline CompactValue percent(float value) {
  return CompactValue::of<YGUnitPercent>(value);
}

/**
 * "auto" keyword
 */
inline CompactValue ofAuto() {
  return CompactValue::ofAuto();
}

/**
 * Undefined
 */
inline CompactValue undefined() {
  return CompactValue::ofUndefined();
}

} // namespace facebook::yoga::value
