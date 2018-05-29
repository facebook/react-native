/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
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

  YGDirection direction = YGDirectionInherit;
  YGFlexDirection flexDirection = YGFlexDirectionColumn;
  YGJustify justifyContent = YGJustifyFlexStart;
  YGAlign alignContent = YGAlignFlexStart;
  YGAlign alignItems = YGAlignStretch;
  YGAlign alignSelf = YGAlignAuto;
  YGPositionType positionType = YGPositionTypeRelative;
  YGWrap flexWrap = YGWrapNoWrap;
  YGOverflow overflow = YGOverflowVisible;
  YGDisplay display = YGDisplayFlex;
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

  YGStyle() = default;
  bool operator==(const YGStyle& style);

  bool operator!=(YGStyle style) {
    return !(*this == style);
  }
  ~YGStyle() = default;
};
