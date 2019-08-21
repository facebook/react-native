/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <cstdint>
#include <type_traits>
#include "Bitfield.h"
#include "CompactValue.h"
#include "YGEnums.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

class YGStyle {
  template <typename Enum>
  using Values =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<Enum>()>;
  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  using Dimensions = Values<YGDimension>;
  using Edges = Values<YGEdge>;

  template <typename T, T YGStyle::*Prop>
  struct Ref {
    YGStyle& style;
    operator T() const { return style.*Prop; }
    Ref<T, Prop>& operator=(T value) {
      style.*Prop = value;
      return *this;
    }
  };

  template <typename Idx, Values<Idx> YGStyle::*Prop>
  struct IdxRef {
    struct Ref {
      YGStyle& style;
      Idx idx;
      operator CompactValue() const { return (style.*Prop)[idx]; }
      operator YGValue() const { return (style.*Prop)[idx]; }
      Ref& operator=(CompactValue value) {
        (style.*Prop)[idx] = value;
        return *this;
      }
    };

    YGStyle& style;
    IdxRef<Idx, Prop>& operator=(const Values<Idx>& values) {
      style.*Prop = values;
      return *this;
    }
    operator const Values<Idx>&() const { return style.*Prop; }
    Ref operator[](Idx idx) { return {style, idx}; }
    CompactValue operator[](Idx idx) const { return (style.*Prop)[idx]; }
  };

  YGStyle() = default;
  ~YGStyle() = default;

private:
  static constexpr size_t directionIdx = 0;
  static constexpr size_t flexDirectionIdx = 1;
  static constexpr size_t justifyContentIdx = 2;
  static constexpr size_t alignContentIdx = 3;
  static constexpr size_t alignItemsIdx = 4;
  static constexpr size_t alignSelfIdx = 5;
  static constexpr size_t positionTypeIdx = 6;
  static constexpr size_t flexWrapIdx = 7;
  static constexpr size_t overflowIdx = 8;
  static constexpr size_t displayIdx = 9;
  using Flags = facebook::yoga::Bitfield<
      uint32_t,
      YGDirection,
      YGFlexDirection,
      YGJustify,
      YGAlign,
      YGAlign,
      YGAlign,
      YGPositionType,
      YGWrap,
      YGOverflow,
      YGDisplay>;

  Flags flags_ = {YGDirectionInherit,
                  YGFlexDirectionColumn,
                  YGJustifyFlexStart,
                  YGAlignFlexStart,
                  YGAlignStretch,
                  YGAlignAuto,
                  YGPositionTypeRelative,
                  YGWrapNoWrap,
                  YGOverflowVisible,
                  YGDisplayFlex};
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

public:
  // for library users needing a type
  using ValueRepr = std::remove_reference<decltype(margin_[0])>::type;

  YGDirection direction() const { return flags_.at<directionIdx>(); }
  Flags::Ref<directionIdx> direction() { return flags_.at<directionIdx>(); }

  YGFlexDirection flexDirection() const {
    return flags_.at<flexDirectionIdx>();
  }
  Flags::Ref<flexDirectionIdx> flexDirection() {
    return flags_.at<flexDirectionIdx>();
  }

  YGJustify justifyContent() const { return flags_.at<justifyContentIdx>(); }
  Flags::Ref<justifyContentIdx> justifyContent() {
    return flags_.at<justifyContentIdx>();
  }

  YGAlign alignContent() const { return flags_.at<alignContentIdx>(); }
  Flags::Ref<alignContentIdx> alignContent() {
    return flags_.at<alignContentIdx>();
  }

  YGAlign alignItems() const { return flags_.at<alignItemsIdx>(); }
  Flags::Ref<alignItemsIdx> alignItems() { return flags_.at<alignItemsIdx>(); }

  YGAlign alignSelf() const { return flags_.at<alignSelfIdx>(); }
  Flags::Ref<alignSelfIdx> alignSelf() { return flags_.at<alignSelfIdx>(); }

  YGPositionType positionType() const { return flags_.at<positionTypeIdx>(); }
  Flags::Ref<positionTypeIdx> positionType() {
    return flags_.at<positionTypeIdx>();
  }

  YGWrap flexWrap() const { return flags_.at<flexWrapIdx>(); }
  Flags::Ref<flexWrapIdx> flexWrap() { return flags_.at<flexWrapIdx>(); }

  YGOverflow overflow() const { return flags_.at<overflowIdx>(); }
  Flags::Ref<overflowIdx> overflow() { return flags_.at<overflowIdx>(); }

  YGDisplay display() const { return flags_.at<displayIdx>(); }
  Flags::Ref<displayIdx> display() { return flags_.at<displayIdx>(); }

  YGFloatOptional flex() const { return flex_; }
  Ref<YGFloatOptional, &YGStyle::flex_> flex() { return {*this}; }

  YGFloatOptional flexGrow() const { return flexGrow_; }
  Ref<YGFloatOptional, &YGStyle::flexGrow_> flexGrow() { return {*this}; }

  YGFloatOptional flexShrink() const { return flexShrink_; }
  Ref<YGFloatOptional, &YGStyle::flexShrink_> flexShrink() { return {*this}; }

  CompactValue flexBasis() const { return flexBasis_; }
  Ref<CompactValue, &YGStyle::flexBasis_> flexBasis() { return {*this}; }

  const Edges& margin() const { return margin_; }
  IdxRef<YGEdge, &YGStyle::margin_> margin() { return {*this}; }

  const Edges& position() const { return position_; }
  IdxRef<YGEdge, &YGStyle::position_> position() { return {*this}; }

  const Edges& padding() const { return padding_; }
  IdxRef<YGEdge, &YGStyle::padding_> padding() { return {*this}; }

  const Edges& border() const { return border_; }
  IdxRef<YGEdge, &YGStyle::border_> border() { return {*this}; }

  const Dimensions& dimensions() const { return dimensions_; }
  IdxRef<YGDimension, &YGStyle::dimensions_> dimensions() { return {*this}; }

  const Dimensions& minDimensions() const { return minDimensions_; }
  IdxRef<YGDimension, &YGStyle::minDimensions_> minDimensions() {
    return {*this};
  }

  const Dimensions& maxDimensions() const { return maxDimensions_; }
  IdxRef<YGDimension, &YGStyle::maxDimensions_> maxDimensions() {
    return {*this};
  }

  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio() const { return aspectRatio_; }
  Ref<YGFloatOptional, &YGStyle::aspectRatio_> aspectRatio() { return {*this}; }
};

bool operator==(const YGStyle& lhs, const YGStyle& rhs);
inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}
