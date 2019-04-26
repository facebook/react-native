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

#define BITFIELD_ACCESSORS(FIELD)                             \
  decltype(FIELD##_) get_##FIELD() const { return FIELD##_; } \
  void set_##FIELD(decltype(FIELD##_) x) { FIELD##_ = x; }

#define BITFIELD_REF(FIELD) \
  { *this, &YGStyle::get_##FIELD, &YGStyle::set_##FIELD }

class YGStyle {
  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  using Dimensions = facebook::yoga::detail::Values<2>;
  using Edges =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<YGEdge>()>;

  template <typename T>
  struct BitfieldRef {
    YGStyle& style;
    T (YGStyle::*get)() const;
    void (YGStyle::*set)(T);

    operator T() const { return (style.*get)(); }
    BitfieldRef<T>& operator=(T x) {
      (style.*set)(x);
      return *this;
    }
  };

  YGStyle()
      : direction_(YGDirectionInherit),
        flexDirection_(YGFlexDirectionColumn),
        justifyContent_(YGJustifyFlexStart),
        alignContent_(YGAlignFlexStart),
        alignItems_(YGAlignStretch),
        alignSelf_(YGAlignAuto),
        positionType_(YGPositionTypeRelative),
        flexWrap_(YGWrapNoWrap),
        overflow_(YGOverflowVisible),
        display_(YGDisplayFlex) {}
  ~YGStyle() = default;

  YGDirection direction() const { return direction_; }
  BitfieldRef<YGDirection> direction() { return BITFIELD_REF(direction); }

  YGFlexDirection flexDirection() const { return flexDirection_; }
  BitfieldRef<YGFlexDirection> flexDirection() {
    return BITFIELD_REF(flexDirection);
  }

  YGJustify justifyContent() const { return justifyContent_; }
  BitfieldRef<YGJustify> justifyContent() {
    return BITFIELD_REF(justifyContent);
  }

  YGAlign alignContent() const { return alignContent_; }
  BitfieldRef<YGAlign> alignContent() { return BITFIELD_REF(alignContent); }

  YGAlign alignItems() const { return alignItems_; }
  BitfieldRef<YGAlign> alignItems() { return BITFIELD_REF(alignItems); }

  YGAlign alignSelf() const { return alignSelf_; }
  BitfieldRef<YGAlign> alignSelf() { return BITFIELD_REF(alignSelf); }

  YGPositionType positionType() const { return positionType_; }
  BitfieldRef<YGPositionType> positionType() {
    return BITFIELD_REF(positionType);
  }

  YGWrap flexWrap() const { return flexWrap_; }
  BitfieldRef<YGWrap> flexWrap() { return BITFIELD_REF(flexWrap); }

  YGOverflow overflow() const { return overflow_; }
  BitfieldRef<YGOverflow> overflow() { return BITFIELD_REF(overflow); }

  YGDisplay display() const { return display_; }
  BitfieldRef<YGDisplay> display() { return BITFIELD_REF(display); }

  YGFloatOptional flex() const { return flex_; }
  YGFloatOptional& flex() { return flex_; }

  YGFloatOptional flexGrow() const { return flexGrow_; }
  YGFloatOptional& flexGrow() { return flexGrow_; }

  YGFloatOptional flexShrink() const { return flexShrink_; }
  YGFloatOptional& flexShrink() { return flexShrink_; }

  CompactValue flexBasis() const { return flexBasis_; }
  CompactValue& flexBasis() { return flexBasis_; }

  const Edges& margin() const { return margin_; }
  Edges& margin() { return margin_; }

  const Edges& position() const { return position_; }
  Edges& position() { return position_; }

  const Edges& padding() const { return padding_; }
  Edges& padding() { return padding_; }

  const Edges& border() const { return border_; }
  Edges& border() { return border_; }

  const Dimensions& dimensions() const { return dimensions_; }
  Dimensions& dimensions() { return dimensions_; }

  const Dimensions& minDimensions() const { return minDimensions_; }
  Dimensions& minDimensions() { return minDimensions_; }

  const Dimensions& maxDimensions() const { return maxDimensions_; }
  Dimensions& maxDimensions() { return maxDimensions_; }

  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio() const { return aspectRatio_; }
  YGFloatOptional& aspectRatio() { return aspectRatio_; }

private:
  /* Some platforms don't support enum bitfields,
     so please use BITFIELD_ENUM_SIZED(BITS_COUNT) */
  YGDirection direction_ BITFIELD_ENUM_SIZED(2);
  YGFlexDirection flexDirection_ BITFIELD_ENUM_SIZED(2);
  YGJustify justifyContent_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignContent_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignItems_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignSelf_ BITFIELD_ENUM_SIZED(3);
  YGPositionType positionType_ BITFIELD_ENUM_SIZED(1);
  YGWrap flexWrap_ BITFIELD_ENUM_SIZED(2);
  YGOverflow overflow_ BITFIELD_ENUM_SIZED(2);
  YGDisplay display_ BITFIELD_ENUM_SIZED(1);
  YGFloatOptional flex_ = {};
  YGFloatOptional flexGrow_ = {};
  YGFloatOptional flexShrink_ = {};
  CompactValue flexBasis_ = CompactValue::ofAuto();
  Edges margin_ = {};
  Edges position_ = {};
  Edges padding_ = {};
  Edges border_ = {};
  Dimensions dimensions_{CompactValue::ofAuto()};
  Dimensions minDimensions_ = {};
  Dimensions maxDimensions_ = {};
  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio_ = {};

  BITFIELD_ACCESSORS(direction)
  BITFIELD_ACCESSORS(flexDirection)
  BITFIELD_ACCESSORS(justifyContent)
  BITFIELD_ACCESSORS(alignContent);
  BITFIELD_ACCESSORS(alignItems);
  BITFIELD_ACCESSORS(alignSelf);
  BITFIELD_ACCESSORS(positionType);
  BITFIELD_ACCESSORS(flexWrap);
  BITFIELD_ACCESSORS(overflow);
  BITFIELD_ACCESSORS(display);
};

bool operator==(const YGStyle& lhs, const YGStyle& rhs);
inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}

#undef BITFIELD_ENUM_SIZED
#undef BITFIELD_ACCESSORS
#undef BITFIELD_REF
