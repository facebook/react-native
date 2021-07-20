/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include <algorithm>
#include <array>
#include <cstdint>
#include <type_traits>
#include "CompactValue.h"
#include "YGEnums.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"
#include "BitUtils.h"

class YOGA_EXPORT YGStyle {
  template <typename Enum>
  using Values =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<Enum>()>;
  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  using Dimensions = Values<YGDimension>;
  using Edges = Values<YGEdge>;

  template <typename T>
  struct BitfieldRef {
    YGStyle& style;
    size_t offset;
    operator T() const {
      return facebook::yoga::detail::getEnumData<T>(style.flags, offset);
    }
    BitfieldRef<T>& operator=(T x) {
      facebook::yoga::detail::setEnumData<T>(style.flags, offset, x);
      return *this;
    }
  };

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

  YGStyle() {
    alignContent() = YGAlignFlexStart;
    alignItems() = YGAlignStretch;
  }
  ~YGStyle() = default;

private:
  static constexpr size_t directionOffset = 0;
  static constexpr size_t flexdirectionOffset =
      directionOffset + facebook::yoga::detail::bitWidthFn<YGDirection>();
  static constexpr size_t justifyContentOffset = flexdirectionOffset +
      facebook::yoga::detail::bitWidthFn<YGFlexDirection>();
  static constexpr size_t alignContentOffset =
      justifyContentOffset + facebook::yoga::detail::bitWidthFn<YGJustify>();
  static constexpr size_t alignItemsOffset =
      alignContentOffset + facebook::yoga::detail::bitWidthFn<YGAlign>();
  static constexpr size_t alignSelfOffset =
      alignItemsOffset + facebook::yoga::detail::bitWidthFn<YGAlign>();
  static constexpr size_t positionTypeOffset =
      alignSelfOffset + facebook::yoga::detail::bitWidthFn<YGAlign>();
  static constexpr size_t flexWrapOffset =
      positionTypeOffset + facebook::yoga::detail::bitWidthFn<YGPositionType>();
  static constexpr size_t overflowOffset =
      flexWrapOffset + facebook::yoga::detail::bitWidthFn<YGWrap>();
  static constexpr size_t displayOffset =
      overflowOffset + facebook::yoga::detail::bitWidthFn<YGOverflow>();

  uint32_t flags = 0;

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

  YGDirection direction() const {
    return facebook::yoga::detail::getEnumData<YGDirection>(
        flags, directionOffset);
  }
  BitfieldRef<YGDirection> direction() { return {*this, directionOffset}; }

  YGFlexDirection flexDirection() const {
    return facebook::yoga::detail::getEnumData<YGFlexDirection>(
        flags, flexdirectionOffset);
  }
  BitfieldRef<YGFlexDirection> flexDirection() {
    return {*this, flexdirectionOffset};
  }

  YGJustify justifyContent() const {
    return facebook::yoga::detail::getEnumData<YGJustify>(
        flags, justifyContentOffset);
  }
  BitfieldRef<YGJustify> justifyContent() {
    return {*this, justifyContentOffset};
  }

  YGAlign alignContent() const {
    return facebook::yoga::detail::getEnumData<YGAlign>(
        flags, alignContentOffset);
  }
  BitfieldRef<YGAlign> alignContent() { return {*this, alignContentOffset}; }

  YGAlign alignItems() const {
    return facebook::yoga::detail::getEnumData<YGAlign>(
        flags, alignItemsOffset);
  }
  BitfieldRef<YGAlign> alignItems() { return {*this, alignItemsOffset}; }

  YGAlign alignSelf() const {
    return facebook::yoga::detail::getEnumData<YGAlign>(flags, alignSelfOffset);
  }
  BitfieldRef<YGAlign> alignSelf() { return {*this, alignSelfOffset}; }

  YGPositionType positionType() const {
    return facebook::yoga::detail::getEnumData<YGPositionType>(
        flags, positionTypeOffset);
  }
  BitfieldRef<YGPositionType> positionType() {
    return {*this, positionTypeOffset};
  }

  YGWrap flexWrap() const {
    return facebook::yoga::detail::getEnumData<YGWrap>(flags, flexWrapOffset);
  }
  BitfieldRef<YGWrap> flexWrap() { return {*this, flexWrapOffset}; }

  YGOverflow overflow() const {
    return facebook::yoga::detail::getEnumData<YGOverflow>(
        flags, overflowOffset);
  }
  BitfieldRef<YGOverflow> overflow() { return {*this, overflowOffset}; }

  YGDisplay display() const {
    return facebook::yoga::detail::getEnumData<YGDisplay>(flags, displayOffset);
  }
  BitfieldRef<YGDisplay> display() { return {*this, displayOffset}; }

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

YOGA_EXPORT bool operator==(const YGStyle& lhs, const YGStyle& rhs);
YOGA_EXPORT inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}

#endif
