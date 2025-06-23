/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/YGValue.h>
#include <yoga/numeric/Comparison.h>

using namespace facebook;
using namespace facebook::yoga;

const YGValue YGValueZero = {0, YGUnitPoint};
const YGValue YGValueUndefined = {YGUndefined, YGUnitUndefined};
const YGValue YGValueAuto = {YGUndefined, YGUnitAuto};

bool YGFloatIsUndefined(const float value) {
  return yoga::isUndefined(value);
}
