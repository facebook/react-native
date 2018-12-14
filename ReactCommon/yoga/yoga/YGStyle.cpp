/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGStyle.h"

// Yoga specific properties, not compatible with flexbox specification
bool YGStyle::operator==(const YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && YGValueEqual(flexBasis, style.flexBasis) &&
      margin == style.margin && position == style.position &&
      padding == style.padding && border == style.border &&
      dimensions == style.dimensions && minDimensions == style.minDimensions &&
      maxDimensions == style.maxDimensions;

  areNonFloatValuesEqual =
      areNonFloatValuesEqual && flex.isUndefined() == style.flex.isUndefined();
  if (areNonFloatValuesEqual && !flex.isUndefined() &&
      !style.flex.isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexGrow.isUndefined() == style.flexGrow.isUndefined();
  if (areNonFloatValuesEqual && !flexGrow.isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexShrink.isUndefined() == style.flexShrink.isUndefined();
  if (areNonFloatValuesEqual && !style.flexShrink.isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(aspectRatio.isUndefined() && style.aspectRatio.isUndefined())) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}
