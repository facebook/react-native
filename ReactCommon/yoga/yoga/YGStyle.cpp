/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#include "YGStyle.h"

const YGValue kYGValueUndefined = {YGUndefined, YGUnitUndefined};

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
      flex(YGUndefined),
      flexGrow(YGUndefined),
      flexShrink(YGUndefined),
      flexBasis(kYGValueAuto),
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

  if (!(std::isnan(flex) && std::isnan(style.flex))) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  if (!(std::isnan(flexGrow) && std::isnan(style.flexGrow))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  if (!(std::isnan(flexShrink) && std::isnan(style.flexShrink))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(std::isnan(aspectRatio) && std::isnan(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool YGStyle::operator!=(YGStyle style) {
  return !(*this == style);
}

YGStyle::~YGStyle() {}
