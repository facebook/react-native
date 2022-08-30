/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Rounding.h"
#include <cmath>
#include "Utils.h"

namespace facebook {
namespace flexlayout {
namespace algo {

using namespace facebook::flexlayout::utils;

auto RoundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) -> float {
  double scaledValue = value * pointScaleFactor;

  if (isUndefined(scaledValue) || isUndefined(pointScaleFactor)) {
    return NAN;
  }

  // We want to calculate `fractial` such that `floor(scaledValue) = scaledValue
  // - fractial`.
  double fractial = fmod(scaledValue, 1.0f);
  if (fractial < 0) {
    // This branch is for handling negative numbers for `value`.
    //
    // Regarding `floor` and `ceil`. Note that for a number x, `floor(x) <= x <=
    // ceil(x)` even for negative numbers. Here are a couple of examples:
    //   - x =  2.2: floor( 2.2) =  2, ceil( 2.2) =  3
    //   - x = -2.2: floor(-2.2) = -3, ceil(-2.2) = -2
    //
    // Regarding `fmodf`. For fractional negative numbers, `fmodf` returns a
    // negative number. For example, `fmodf(-2.2) = -0.2`. However, we want
    // `fractial` to be the number such that subtracting it from `value` will
    // give us `floor(value)`. In the case of negative numbers, adding 1 to
    // `fmodf(value)` gives us this. Let's continue the example from above:
    //   - fractial = fmodf(-2.2) = -0.2
    //   - Add 1 to the fraction: fractial2 = fractial + 1 = -0.2 + 1 = 0.8
    //   - Finding the `floor`: -2.2 - fractial2 = -2.2 - 0.8 = -3
    ++fractial;
  }

  // Check if the value is already rounded or we force-round down or up
  if (FlexLayoutDoubleEqual(fractial, 0) || forceFloor) {
    scaledValue = scaledValue - fractial;
  } else if (FlexLayoutDoubleEqual(fractial, 1.0f) || forceCeil) {
    scaledValue = scaledValue - fractial + 1.0f;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (isDefined(fractial) &&
                 (fractial > 0.5f || FlexLayoutDoubleEqual(fractial, 0.5f))
             ? 1.0f
             : 0.0f);
  }
  return static_cast<Float>(scaledValue / pointScaleFactor);
}

} // namespace algo
} // namespace flexlayout
} // namespace facebook
