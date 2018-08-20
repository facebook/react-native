/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

struct YGStyle {
  using Dimensions = std::array<YGValue, 2>;

  YGDirection direction;
  YGFlexDirection flexDirection;
  YGJustify justifyContent;
  YGAlign alignContent;
  YGAlign alignItems;
  YGAlign alignSelf;
  YGPositionType positionType;
  YGWrap flexWrap;
  YGOverflow overflow;
  YGDisplay display;
  YGFloatOptional flex;
  YGFloatOptional flexGrow;
  YGFloatOptional flexShrink;
  YGValue flexBasis;
  std::array<YGValue, YGEdgeCount> margin;
  std::array<YGValue, YGEdgeCount> position;
  std::array<YGValue, YGEdgeCount> padding;
  std::array<YGValue, YGEdgeCount> border;
  Dimensions dimensions;
  Dimensions minDimensions;
  Dimensions maxDimensions;
  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio;

  YGStyle();
  bool operator==(const YGStyle& style);

  bool operator!=(YGStyle style) {
    return !(*this == style);
  }
  ~YGStyle() = default;
};
