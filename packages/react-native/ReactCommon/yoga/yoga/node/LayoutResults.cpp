/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cmath>

#include <yoga/node/LayoutResults.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

bool LayoutResults::operator==(LayoutResults layout) const {
  bool isEqual = yoga::inexactEquals(position_, layout.position_) &&
      yoga::inexactEquals(dimensions_, layout.dimensions_) &&
      yoga::inexactEquals(margin_, layout.margin_) &&
      yoga::inexactEquals(border_, layout.border_) &&
      yoga::inexactEquals(padding_, layout.padding_) &&
      direction() == layout.direction() &&
      hadOverflow() == layout.hadOverflow() &&
      lastOwnerDirection == layout.lastOwnerDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout &&
      computedFlexBasis == layout.computedFlexBasis;

  for (uint32_t i = 0; i < LayoutResults::MaxCachedMeasurements && isEqual;
       ++i) {
    isEqual = isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
  }

  if (!yoga::isUndefined(measuredDimensions_[0]) ||
      !yoga::isUndefined(layout.measuredDimensions_[0])) {
    isEqual =
        isEqual && (measuredDimensions_[0] == layout.measuredDimensions_[0]);
  }
  if (!yoga::isUndefined(measuredDimensions_[1]) ||
      !yoga::isUndefined(layout.measuredDimensions_[1])) {
    isEqual =
        isEqual && (measuredDimensions_[1] == layout.measuredDimensions_[1]);
  }

  return isEqual;
}

} // namespace facebook::yoga
