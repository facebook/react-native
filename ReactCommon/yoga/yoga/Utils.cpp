/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "Utils.h"

bool YGValueEqual(const YGValue a, const YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == YGUnitUndefined ||
      (std::isnan(a.value) && std::isnan(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}
