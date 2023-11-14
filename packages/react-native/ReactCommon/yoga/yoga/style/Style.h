/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <array>
#include <cstdint>
#include <type_traits>

#include <yoga/Yoga.h>

#include <yoga/bits/NumericBitfield.h>
#include <yoga/enums/Align.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Display.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/Gutter.h>
#include <yoga/enums/Justify.h>
#include <yoga/enums/Overflow.h>
#include <yoga/enums/PositionType.h>
#include <yoga/enums/Wrap.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/CompactValue.h>

namespace facebook::yoga {

class YG_EXPORT Style {
  template <typename Enum>
  using Values = std::array<CompactValue, ordinalCount<Enum>()>;

  using Dimensions = Values<Dimension>;
  using Edges = Values<YGEdge>;
  using Gutters = Values<Gutter>;

 public:
  static constexpr float DefaultFlexGrow = 0.0f;
  static constexpr float DefaultFlexShrink = 0.0f;
  static constexpr float WebDefaultFlexShrink = 1.0f;

  template <typename T>
  struct BitfieldRef {
    Style& style;
    uint8_t offset;
    operator T() const {
      return getEnumData<T>(style.flags, offset);
    }
    BitfieldRef<T>& operator=(T x) {
      setEnumData<T>(style.flags, offset, x);
      return *this;
    }
  };

  template <typename T, T Style::*Prop>
  struct Ref {
    Style& style;
    operator T() const {
      return style.*Prop;
    }
    Ref<T, Prop>& operator=(T value) {
      style.*Prop = value;
      return *this;
    }
  };

  Style() {
    alignContent() = Align::FlexStart;
    alignItems() = Align::Stretch;
  }
  ~Style() = default;

 private:
  static constexpr uint8_t directionOffset = 0;
  static constexpr uint8_t flexdirectionOffset =
      directionOffset + minimumBitCount<Direction>();
  static constexpr uint8_t justifyContentOffset =
      flexdirectionOffset + minimumBitCount<FlexDirection>();
  static constexpr uint8_t alignContentOffset =
      justifyContentOffset + minimumBitCount<Justify>();
  static constexpr uint8_t alignItemsOffset =
      alignContentOffset + minimumBitCount<Align>();
  static constexpr uint8_t alignSelfOffset =
      alignItemsOffset + minimumBitCount<Align>();
  static constexpr uint8_t positionTypeOffset =
      alignSelfOffset + minimumBitCount<Align>();
  static constexpr uint8_t flexWrapOffset =
      positionTypeOffset + minimumBitCount<PositionType>();
  static constexpr uint8_t overflowOffset =
      flexWrapOffset + minimumBitCount<Wrap>();
  static constexpr uint8_t displayOffset =
      overflowOffset + minimumBitCount<Overflow>();

  uint32_t flags = 0;

  FloatOptional flex_ = {};
  FloatOptional flexGrow_ = {};
  FloatOptional flexShrink_ = {};
  CompactValue flexBasis_ = CompactValue::ofAuto();
  Edges margin_ = {};
  Edges position_ = {};
  Edges padding_ = {};
  Edges border_ = {};
  Gutters gap_ = {};
  Dimensions dimensions_{CompactValue::ofAuto(), CompactValue::ofAuto()};
  Dimensions minDimensions_ = {};
  Dimensions maxDimensions_ = {};
  // Yoga specific properties, not compatible with flexbox specification
  FloatOptional aspectRatio_ = {};

 public:
  Direction direction() const {
    return getEnumData<Direction>(flags, directionOffset);
  }
  BitfieldRef<Direction> direction() {
    return {*this, directionOffset};
  }

  FlexDirection flexDirection() const {
    return getEnumData<FlexDirection>(flags, flexdirectionOffset);
  }
  BitfieldRef<FlexDirection> flexDirection() {
    return {*this, flexdirectionOffset};
  }

  Justify justifyContent() const {
    return getEnumData<Justify>(flags, justifyContentOffset);
  }
  BitfieldRef<Justify> justifyContent() {
    return {*this, justifyContentOffset};
  }

  Align alignContent() const {
    return getEnumData<Align>(flags, alignContentOffset);
  }
  BitfieldRef<Align> alignContent() {
    return {*this, alignContentOffset};
  }

  Align alignItems() const {
    return getEnumData<Align>(flags, alignItemsOffset);
  }
  BitfieldRef<Align> alignItems() {
    return {*this, alignItemsOffset};
  }

  Align alignSelf() const {
    return getEnumData<Align>(flags, alignSelfOffset);
  }
  BitfieldRef<Align> alignSelf() {
    return {*this, alignSelfOffset};
  }

  PositionType positionType() const {
    return getEnumData<PositionType>(flags, positionTypeOffset);
  }
  BitfieldRef<PositionType> positionType() {
    return {*this, positionTypeOffset};
  }

  Wrap flexWrap() const {
    return getEnumData<Wrap>(flags, flexWrapOffset);
  }
  BitfieldRef<Wrap> flexWrap() {
    return {*this, flexWrapOffset};
  }

  Overflow overflow() const {
    return getEnumData<Overflow>(flags, overflowOffset);
  }
  BitfieldRef<Overflow> overflow() {
    return {*this, overflowOffset};
  }

  Display display() const {
    return getEnumData<Display>(flags, displayOffset);
  }
  BitfieldRef<Display> display() {
    return {*this, displayOffset};
  }

  FloatOptional flex() const {
    return flex_;
  }
  Ref<FloatOptional, &Style::flex_> flex() {
    return {*this};
  }

  FloatOptional flexGrow() const {
    return flexGrow_;
  }
  Ref<FloatOptional, &Style::flexGrow_> flexGrow() {
    return {*this};
  }

  FloatOptional flexShrink() const {
    return flexShrink_;
  }
  Ref<FloatOptional, &Style::flexShrink_> flexShrink() {
    return {*this};
  }

  CompactValue flexBasis() const {
    return flexBasis_;
  }
  Ref<CompactValue, &Style::flexBasis_> flexBasis() {
    return {*this};
  }

  CompactValue margin(YGEdge edge) const {
    return margin_[edge];
  }
  void setMargin(YGEdge edge, CompactValue value) {
    margin_[edge] = value;
  }

  CompactValue position(YGEdge edge) const {
    return position_[edge];
  }
  void setPosition(YGEdge edge, CompactValue value) {
    position_[edge] = value;
  }

  CompactValue padding(YGEdge edge) const {
    return padding_[edge];
  }
  void setPadding(YGEdge edge, CompactValue value) {
    padding_[edge] = value;
  }

  CompactValue border(YGEdge edge) const {
    return border_[edge];
  }
  void setBorder(YGEdge edge, CompactValue value) {
    border_[edge] = value;
  }

  CompactValue gap(Gutter gutter) const {
    return gap_[yoga::to_underlying(gutter)];
  }
  void setGap(Gutter gutter, CompactValue value) {
    gap_[yoga::to_underlying(gutter)] = value;
  }

  CompactValue dimension(Dimension axis) const {
    return dimensions_[yoga::to_underlying(axis)];
  }
  void setDimension(Dimension axis, CompactValue value) {
    dimensions_[yoga::to_underlying(axis)] = value;
  }

  CompactValue minDimension(Dimension axis) const {
    return minDimensions_[yoga::to_underlying(axis)];
  }
  void setMinDimension(Dimension axis, CompactValue value) {
    minDimensions_[yoga::to_underlying(axis)] = value;
  }

  CompactValue maxDimension(Dimension axis) const {
    return maxDimensions_[yoga::to_underlying(axis)];
  }
  void setMaxDimension(Dimension axis, CompactValue value) {
    maxDimensions_[yoga::to_underlying(axis)] = value;
  }

  // Yoga specific properties, not compatible with flexbox specification
  FloatOptional aspectRatio() const {
    return aspectRatio_;
  }
  Ref<FloatOptional, &Style::aspectRatio_> aspectRatio() {
    return {*this};
  }

  CompactValue resolveColumnGap() const {
    if (gap_[yoga::to_underlying(Gutter::Column)].isDefined()) {
      return gap_[yoga::to_underlying(Gutter::Column)];
    } else {
      return gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  CompactValue resolveRowGap() const {
    if (gap_[yoga::to_underlying(Gutter::Row)].isDefined()) {
      return gap_[yoga::to_underlying(Gutter::Row)];
    } else {
      return gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  bool operator==(const Style& other) const {
    return flags == other.flags && inexactEquals(flex_, other.flex_) &&
        inexactEquals(flexGrow_, other.flexGrow_) &&
        inexactEquals(flexShrink_, other.flexShrink_) &&
        inexactEquals(flexBasis_, other.flexBasis_) &&
        inexactEquals(margin_, other.margin_) &&
        inexactEquals(position_, other.position_) &&
        inexactEquals(padding_, other.padding_) &&
        inexactEquals(border_, other.border_) &&
        inexactEquals(gap_, other.gap_) &&
        inexactEquals(dimensions_, other.dimensions_) &&
        inexactEquals(minDimensions_, other.minDimensions_) &&
        inexactEquals(maxDimensions_, other.maxDimensions_) &&
        inexactEquals(aspectRatio_, other.aspectRatio_);
  }

  bool operator!=(const Style& other) const {
    return !(*this == other);
  }
};

} // namespace facebook::yoga
