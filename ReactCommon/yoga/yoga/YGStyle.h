/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <bitset>
#include <cstdint>
#include <type_traits>
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

#define BITFIELD_REF(FIELD)  \
  BitfieldRef<               \
      decltype(FIELD##_),    \
      &YGStyle::get_##FIELD, \
      &YGStyle::set_##FIELD, \
      FIELD##Bit>

class YGStyle {
  template <typename Enum>
  using Values =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<Enum>()>;
  using CompactValue = facebook::yoga::detail::CompactValue;

  static constexpr uint64_t allBits(int fromBit, int toBit) {
    return fromBit < toBit
        ? (uint64_t{1} << fromBit) | allBits(fromBit + 1, toBit)
        : 0;
  }

public:
  using Dimensions = Values<YGDimension>;
  using Edges = Values<YGEdge>;

  template <typename T, T YGStyle::*Prop, int PropBit>
  struct Ref {
    YGStyle& style;
    operator T() const { return style.*Prop; }
    Ref<T, Prop, PropBit>& operator=(T value) {
      style.*Prop = value;
      style.assignedProps_.set(PropBit);
      return *this;
    }
  };

  template <typename Idx, Values<Idx> YGStyle::*Prop, int PropBit>
  struct IdxRef {
    struct Ref {
      YGStyle& style;
      Idx idx;
      operator CompactValue() const { return (style.*Prop)[idx]; }
      operator YGValue() const { return (style.*Prop)[idx]; }
      Ref& operator=(CompactValue value) {
        (style.*Prop)[idx] = value;
        style.assignedProps_.set(PropBit + idx);
        return *this;
      }
    };

    YGStyle& style;
    IdxRef<Idx, Prop, PropBit>& operator=(const Values<Idx>& values) {
      style.*Prop = values;
      style.assignedProps_ |=
          allBits(PropBit, PropBit + facebook::yoga::enums::count<Idx>());
      return *this;
    }
    operator const Values<Idx>&() const { return style.*Prop; }
    Ref operator[](Idx idx) { return {style, idx}; }
    CompactValue operator[](Idx idx) const { return (style.*Prop)[idx]; }
  };

  template <
      typename T,
      T (YGStyle::*Get)() const,
      void (YGStyle::*Set)(T),
      int PropBit>
  struct BitfieldRef {
    YGStyle& style;

    operator T() const { return (style.*Get)(); }
    BitfieldRef<T, Get, Set, PropBit>& operator=(T x) {
      (style.*Set)(x);
      style.assignedProps_.set(PropBit);
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

  static constexpr int directionBit = 0;
  static constexpr int flexDirectionBit = directionBit + 1;
  static constexpr int justifyContentBit = flexDirectionBit + 1;
  static constexpr int alignContentBit = justifyContentBit + 1;
  static constexpr int alignItemsBit = alignContentBit + 1;
  static constexpr int alignSelfBit = alignItemsBit + 1;
  static constexpr int positionTypeBit = alignSelfBit + 1;
  static constexpr int flexWrapBit = positionTypeBit + 1;
  static constexpr int overflowBit = flexWrapBit + 1;
  static constexpr int displayBit = overflowBit + 1;
  static constexpr int flexBit = displayBit + 1;
  static constexpr int flexGrowBit = flexBit + 1;
  static constexpr int flexShrinkBit = flexGrowBit + 1;
  static constexpr int flexBasisBit = flexShrinkBit + 1;
  static constexpr int marginBit = flexBasisBit + 1;
  static constexpr int positionBit =
      marginBit + facebook::yoga::enums::count<YGEdge>();
  static constexpr int paddingBit =
      positionBit + facebook::yoga::enums::count<YGEdge>();
  static constexpr int borderBit =
      paddingBit + facebook::yoga::enums::count<YGEdge>();
  static constexpr int dimensionsBit =
      borderBit + facebook::yoga::enums::count<YGEdge>();
  static constexpr int maxDimensionsBit =
      dimensionsBit + facebook::yoga::enums::count<YGDimension>();
  static constexpr int minDimensionsBit =
      maxDimensionsBit + facebook::yoga::enums::count<YGDimension>();
  static constexpr int aspectRatioBit =
      minDimensionsBit + facebook::yoga::enums::count<YGDimension>();

  static constexpr int numStyles = aspectRatioBit + 1;

private:
  std::bitset<aspectRatioBit + 1> assignedProps_;

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

public:
  const decltype(assignedProps_)& assignedProps() const {
    return assignedProps_;
  }

  // for library users needing a type
  using ValueRepr = std::remove_reference<decltype(margin_[0])>::type;

  YGDirection direction() const { return direction_; }
  BITFIELD_REF(direction) direction() { return {*this}; }

  YGFlexDirection flexDirection() const { return flexDirection_; }
  BITFIELD_REF(flexDirection) flexDirection() { return {*this}; }

  YGJustify justifyContent() const { return justifyContent_; }
  BITFIELD_REF(justifyContent) justifyContent() { return {*this}; }

  YGAlign alignContent() const { return alignContent_; }
  BITFIELD_REF(alignContent) alignContent() { return {*this}; }

  YGAlign alignItems() const { return alignItems_; }
  BITFIELD_REF(alignItems) alignItems() { return {*this}; }

  YGAlign alignSelf() const { return alignSelf_; }
  BITFIELD_REF(alignSelf) alignSelf() { return {*this}; }

  YGPositionType positionType() const { return positionType_; }
  BITFIELD_REF(positionType) positionType() { return {*this}; }

  YGWrap flexWrap() const { return flexWrap_; }
  BITFIELD_REF(flexWrap) flexWrap() { return {*this}; }

  YGOverflow overflow() const { return overflow_; }
  BITFIELD_REF(overflow) overflow() { return {*this}; }

  YGDisplay display() const { return display_; }
  BITFIELD_REF(display) display() { return {*this}; }

  YGFloatOptional flex() const { return flex_; }
  Ref<YGFloatOptional, &YGStyle::flex_, flexBit> flex() { return {*this}; }

  YGFloatOptional flexGrow() const { return flexGrow_; }
  Ref<YGFloatOptional, &YGStyle::flexGrow_, flexGrowBit> flexGrow() {
    return {*this};
  }

  YGFloatOptional flexShrink() const { return flexShrink_; }
  Ref<YGFloatOptional, &YGStyle::flexShrink_, flexShrinkBit> flexShrink() {
    return {*this};
  }

  CompactValue flexBasis() const { return flexBasis_; }
  Ref<CompactValue, &YGStyle::flexBasis_, flexBasisBit> flexBasis() {
    return {*this};
  }

  const Edges& margin() const { return margin_; }
  IdxRef<YGEdge, &YGStyle::margin_, marginBit> margin() { return {*this}; }

  const Edges& position() const { return position_; }
  IdxRef<YGEdge, &YGStyle::position_, positionBit> position() {
    return {*this};
  }

  const Edges& padding() const { return padding_; }
  IdxRef<YGEdge, &YGStyle::padding_, paddingBit> padding() { return {*this}; }

  const Edges& border() const { return border_; }
  IdxRef<YGEdge, &YGStyle::border_, borderBit> border() { return {*this}; }

  const Dimensions& dimensions() const { return dimensions_; }
  IdxRef<YGDimension, &YGStyle::dimensions_, dimensionsBit> dimensions() {
    return {*this};
  }

  const Dimensions& minDimensions() const { return minDimensions_; }
  IdxRef<YGDimension, &YGStyle::minDimensions_, minDimensionsBit>
  minDimensions() {
    return {*this};
  }

  const Dimensions& maxDimensions() const { return maxDimensions_; }
  IdxRef<YGDimension, &YGStyle::maxDimensions_, maxDimensionsBit>
  maxDimensions() {
    return {*this};
  }

  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio() const { return aspectRatio_; }
  Ref<YGFloatOptional, &YGStyle::aspectRatio_, aspectRatioBit> aspectRatio() {
    return {*this};
  }
};

bool operator==(const YGStyle& lhs, const YGStyle& rhs);
inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}

#undef BITFIELD_ENUM_SIZED
#undef BITFIELD_ACCESSORS
#undef BITFIELD_REF
