/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
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
      YGValueArrayEqual(margin, style.margin) &&
      YGValueArrayEqual(position, style.position) &&
      YGValueArrayEqual(padding, style.padding) &&
      YGValueArrayEqual(border, style.border) &&
      YGValueArrayEqual(dimensions, style.dimensions) &&
      YGValueArrayEqual(minDimensions, style.minDimensions) &&
      YGValueArrayEqual(maxDimensions, style.maxDimensions);

  areNonFloatValuesEqual =
      areNonFloatValuesEqual && flex.isUndefined() == style.flex.isUndefined();
  if (areNonFloatValuesEqual && !flex.isUndefined() &&
      !style.flex.isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flex.getValue() == style.flex.getValue();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexGrow.isUndefined() == style.flexGrow.isUndefined();
  if (areNonFloatValuesEqual && !flexGrow.isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        flexGrow.getValue() == style.flexGrow.getValue();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexShrink.isUndefined() == style.flexShrink.isUndefined();
  if (areNonFloatValuesEqual && !style.flexShrink.isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        flexShrink.getValue() == style.flexShrink.getValue();
  }

  if (!(aspectRatio.isUndefined() && style.aspectRatio.isUndefined())) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        aspectRatio.getValue() == style.aspectRatio.getValue();
  }

  return areNonFloatValuesEqual;
}
