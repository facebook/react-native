/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "YGStyle.h"

const YGValue kYGValueUndefined = {0, YGUnitUndefined};

const YGValue kYGValueAuto = {0, YGUnitAuto};

const std::array<YGValue, YGEdgeCount> kYGDefaultEdgeValuesUnit = {
    {kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined}};

const std::array<YGValue, 2> kYGDefaultDimensionValuesAutoUnit = {
    {kYGValueAuto, kYGValueAuto}};

const std::array<YGValue, 2> kYGDefaultDimensionValuesUnit = {
    {kYGValueUndefined, kYGValueUndefined}};

YGStyle::YGStyle()
    : direction(YGDirectionInherit),
      flexDirection(YGFlexDirectionColumn),
      justifyContent(YGJustifyFlexStart),
      alignContent(YGAlignFlexStart),
      alignItems(YGAlignStretch),
      alignSelf(YGAlignAuto),
      positionType(YGPositionTypeRelative),
      flexWrap(YGWrapNoWrap),
      overflow(YGOverflowVisible),
      display(YGDisplayFlex),
      flex(YGFloatOptional()),
      flexGrow(YGFloatOptional()),
      flexShrink(YGFloatOptional()),
      flexBasis(kYGValueAuto),
      margin(kYGDefaultEdgeValuesUnit),
      position(kYGDefaultEdgeValuesUnit),
      padding(kYGDefaultEdgeValuesUnit),
      border(kYGDefaultEdgeValuesUnit),
      dimensions(kYGDefaultDimensionValuesAutoUnit),
      minDimensions(kYGDefaultDimensionValuesUnit),
      maxDimensions(kYGDefaultDimensionValuesUnit),
      aspectRatio(YGFloatOptional()) {}

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
