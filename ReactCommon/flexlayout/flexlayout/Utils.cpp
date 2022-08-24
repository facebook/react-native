/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Utils.h"
#include <cmath>
#include "Type.h"

namespace facebook {
namespace flexlayout {
namespace utils {

using namespace std;
using namespace facebook::flexlayout;

auto isUndefined(float value) -> bool {
  return std::isnan(value);
}

auto isUndefined(double value) -> bool {
  return std::isnan(value);
}

auto isDefined(float value) -> bool {
  return !isUndefined(value);
}

auto isDefined(double value) -> bool {
  return !isUndefined(value);
}

auto FlexLayoutFloatsEqual(const Float a, const Float b) -> bool {
  if (isDefined(a) && isDefined(b)) {
    return fabs(a - b) < EPSILON;
  }
  return isUndefined(a) && isUndefined(b);
}

auto FlexLayoutDoubleEqual(const double a, const double b) -> bool {
  if (isDefined(a) && isDefined(b)) {
    return fabs(a - b) < EPSILON;
  }
  return isUndefined(a) && isUndefined(b);
}

auto FlexLayoutFloatMax(const Float a, const Float b) -> float {
  if (isDefined(a) && isDefined(b)) {
    return fmax(a, b);
  }
  return isUndefined(a) ? b : a;
}

auto FlexLayoutFloatMin(const Float a, const Float b) -> float {
  if (isDefined(a) && isDefined(b)) {
    return fmin(a, b);
  }

  return isUndefined(a) ? b : a;
}

} // namespace utils
} // namespace flexlayout
} // namespace facebook
