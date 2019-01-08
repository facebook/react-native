/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <initializer_list>
#include "CompactValue.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

constexpr YGValue kYGValueUndefined = {0, YGUnitUndefined};

constexpr YGValue kYGValueAuto = {0, YGUnitAuto};

struct YGStyle {
 private:
  using CompactValue = facebook::yoga::detail::CompactValue;

 public:
  using Dimensions = facebook::yoga::detail::Values<2>;
  using Edges = facebook::yoga::detail::Values<YGEdgeCount>;

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
  CompactValue flexBasis = CompactValue::ofAuto();
  Edges margin = {};
  Edges position = {};
  Edges padding = {};
  Edges border = {};
  Dimensions dimensions{CompactValue::ofAuto()};
  Dimensions minDimensions = {};
  Dimensions maxDimensions = {};
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
