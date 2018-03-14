/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGStyle.h"

#define YGFloatOptionalUndefined \
  { true, 0 }

const YGValue kYGValueUndefined = {0, YGUnitUndefined};

const YGValue kYGValueAuto = {YGUndefined, YGUnitAuto};

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
      flex(YGFloatOptionalUndefined),
      flexGrow(YGFloatOptionalUndefined),
      flexShrink(YGFloatOptionalUndefined),
      flexBasis({0, YGUnitAuto}),
      margin(kYGDefaultEdgeValuesUnit),
      position(kYGDefaultEdgeValuesUnit),
      padding(kYGDefaultEdgeValuesUnit),
      border(kYGDefaultEdgeValuesUnit),
      dimensions(kYGDefaultDimensionValuesAutoUnit),
      minDimensions(kYGDefaultDimensionValuesUnit),
      maxDimensions(kYGDefaultDimensionValuesUnit),
      aspectRatio(YGUndefined) {}

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
      areNonFloatValuesEqual && flex.isUndefined == style.flex.isUndefined;
  if (areNonFloatValuesEqual && !flex.isUndefined && !style.flex.isUndefined) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flex.value == style.flex.value;
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexGrow.isUndefined == style.flexGrow.isUndefined;
  if (areNonFloatValuesEqual && !flexGrow.isUndefined) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow.value == style.flexGrow.value;
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexShrink.isUndefined == style.flexShrink.isUndefined;
  if (areNonFloatValuesEqual && !style.flexShrink.isUndefined) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink.value == style.flexShrink.value;
  }

  if (!(YGFloatIsUndefined(aspectRatio) &&
        YGFloatIsUndefined(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool YGStyle::operator!=(YGStyle style) {
  return !(*this == style);
}

YGStyle::~YGStyle() {}
