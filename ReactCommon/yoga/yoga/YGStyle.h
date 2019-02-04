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
#include "YGEnums.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

#if !defined(ENUM_BITFIELDS_NOT_SUPPORTED)
#define BITFIELD_ENUM_SIZED(num) : num
#else
#define BITFIELD_ENUM_SIZED(num)
#endif

struct YGStyle {
private:
  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  using Dimensions = facebook::yoga::detail::Values<2>;
  using Edges =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<YGEdge>()>;

  /* Some platforms don't support enum bitfields,
     so please use BITFIELD_ENUM_SIZED(BITS_COUNT) */
  YGDirection direction BITFIELD_ENUM_SIZED(2);
  YGFlexDirection flexDirection BITFIELD_ENUM_SIZED(2);
  YGJustify justifyContent BITFIELD_ENUM_SIZED(3);
  YGAlign alignContent BITFIELD_ENUM_SIZED(3);
  YGAlign alignItems BITFIELD_ENUM_SIZED(3);
  YGAlign alignSelf BITFIELD_ENUM_SIZED(3);
  YGPositionType positionType BITFIELD_ENUM_SIZED(1);
  YGWrap flexWrap BITFIELD_ENUM_SIZED(2);
  YGOverflow overflow BITFIELD_ENUM_SIZED(2);
  YGDisplay display BITFIELD_ENUM_SIZED(1);
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
  ~YGStyle() = default;
};

bool operator==(const YGStyle& lhs, const YGStyle& rhs);
inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}
