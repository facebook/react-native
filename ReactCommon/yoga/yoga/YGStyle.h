/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#pragma once
#include "Yoga-internal.h"
#include "Yoga.h"

struct YGStyle {
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
  float flex;
  float flexGrow;
  float flexShrink;
  YGValue flexBasis;
  std::array<YGValue, YGEdgeCount> margin;
  std::array<YGValue, YGEdgeCount> position;
  std::array<YGValue, YGEdgeCount> padding;
  std::array<YGValue, YGEdgeCount> border;
  std::array<YGValue, 2> dimensions;
  std::array<YGValue, 2> minDimensions;
  std::array<YGValue, 2> maxDimensions;
  float aspectRatio;

  YGStyle();
  // Yoga specific properties, not compatible with flexbox specification
  bool operator==(const YGStyle& style);

  bool operator!=(YGStyle style);
  ~YGStyle();
};
