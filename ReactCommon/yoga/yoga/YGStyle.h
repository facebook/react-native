/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

constexpr YGValue kYGValueUndefined = {0, YGUnitUndefined};

constexpr YGValue kYGValueAuto = {0, YGUnitAuto};

constexpr std::array<YGValue, YGEdgeCount> kYGDefaultEdgeValuesUnit = {
    {kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined}};

constexpr std::array<YGValue, 2> kYGDefaultDimensionValuesUnit = {
    {kYGValueUndefined, kYGValueUndefined}};

struct YGStyle {
  using Dimensions = std::array<YGValue, 2>;

  YGDirection direction : 2;
  YGFlexDirection flexDirection : 2;
  YGJustify justifyContent : 3;
  YGAlign alignContent : 3;
  YGAlign alignItems : 3;
  YGAlign alignSelf : 3;
  YGPositionType positionType : 1;
  YGWrap flexWrap : 2;
  YGOverflow overflow : 2;
  YGDisplay display : 1;
  YGFloatOptional flex = {};
  YGFloatOptional flexGrow = {};
  YGFloatOptional flexShrink = {};
  YGValue flexBasis = kYGValueAuto;
  std::array<YGValue, YGEdgeCount> margin = kYGDefaultEdgeValuesUnit;
  std::array<YGValue, YGEdgeCount> position = kYGDefaultEdgeValuesUnit;
  std::array<YGValue, YGEdgeCount> padding = kYGDefaultEdgeValuesUnit;
  std::array<YGValue, YGEdgeCount> border = kYGDefaultEdgeValuesUnit;
  Dimensions dimensions = {{kYGValueAuto, kYGValueAuto}};
  Dimensions minDimensions = kYGDefaultDimensionValuesUnit;
  Dimensions maxDimensions = kYGDefaultDimensionValuesUnit;
  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio = {};

  YGStyle()
      : direction(YGDirectionInherit),
        flexDirection(YGFlexDirectionColumn),
        justifyContent(YGJustifyFlexStart),
        alignContent(YGAlignFlexStart),
        alignItems(YGAlignStretch),
        alignSelf(YGAlignAuto),
        positionType(YGPositionTypeRelative),
        flexWrap(YGWrapNoWrap),
        overflow(YGOverflowVisible),
        display(YGDisplayFlex) {}
  bool operator==(const YGStyle& style);

  bool operator!=(YGStyle style) {
    return !(*this == style);
  }
  ~YGStyle() = default;
};
