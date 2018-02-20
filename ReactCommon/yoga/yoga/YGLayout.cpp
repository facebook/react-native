/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#include "YGLayout.h"

const std::array<float, 2> kYGDefaultDimensionValues = {
    {YGUndefined, YGUndefined}};

YGLayout::YGLayout()
    : position(),
      dimensions(kYGDefaultDimensionValues),
      margin(),
      border(),
      padding(),
      direction(YGDirectionInherit),
      computedFlexBasisGeneration(0),
      computedFlexBasis(YGUndefined),
      hadOverflow(false),
      generationCount(0),
      lastParentDirection((YGDirection)-1),
      nextCachedMeasurementsIndex(0),
      cachedMeasurements(),
      measuredDimensions(kYGDefaultDimensionValues),
      cachedLayout({
          .availableWidth = 0,
          .availableHeight = 0,
          .widthMeasureMode = (YGMeasureMode)-1,
          .heightMeasureMode = (YGMeasureMode)-1,
          .computedWidth = -1,
          .computedHeight = -1,
      }),
      didUseLegacyFlag(false),
      doesLegacyStretchFlagAffectsLayout(false) {}

bool YGLayout::operator==(YGLayout layout) const {
  bool isEqual = position == layout.position &&
      dimensions == layout.dimensions && margin == layout.margin &&
      border == layout.border && padding == layout.padding &&
      direction == layout.direction && hadOverflow == layout.hadOverflow &&
      lastParentDirection == layout.lastParentDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout;

  for (uint32_t i = 0; i < YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
    isEqual = isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
  }

  if (!YGFloatIsUndefined(computedFlexBasis) ||
      !YGFloatIsUndefined(layout.computedFlexBasis)) {
    isEqual = isEqual && (computedFlexBasis == layout.computedFlexBasis);
  }
  if (!YGFloatIsUndefined(measuredDimensions[0]) ||
      !YGFloatIsUndefined(layout.measuredDimensions[0])) {
    isEqual =
        isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
  }
  if (!YGFloatIsUndefined(measuredDimensions[1]) ||
      !YGFloatIsUndefined(layout.measuredDimensions[1])) {
    isEqual =
        isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
  }

  return isEqual;
}

bool YGLayout::operator!=(YGLayout layout) const {
  return !(*this == layout);
}
