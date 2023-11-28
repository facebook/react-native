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
#include <yoga/enums/Edge.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/Gutter.h>
#include <yoga/enums/Justify.h>
#include <yoga/enums/Overflow.h>
#include <yoga/enums/PositionType.h>
#include <yoga/enums/Wrap.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/CompactValue.h>
#include <yoga/style/ValueFactories.h>

namespace facebook::yoga {

class YG_EXPORT Style {
 public:
  /**
   * Style::Length represents a CSS Value which may be one of:
   * 1. Undefined
   * 2. A keyword (e.g. auto)
   * 3. A CSS <length-percentage> value:
   *    a. <length> value (e.g. 10px)
   *    b. <percentage> value of a reference <length>
   * 4. (soon) A math function which returns a <length-percentage> value
   *
   * References:
   * 1. https://www.w3.org/TR/css-values-4/#lengths
   * 2. https://www.w3.org/TR/css-values-4/#percentage-value
   * 3. https://www.w3.org/TR/css-values-4/#mixed-percentages
   * 4. https://www.w3.org/TR/css-values-4/#math
   */
  using Length = CompactValue;

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

  Style() {
    alignContent() = Align::FlexStart;
    alignItems() = Align::Stretch;
  }
  ~Style() = default;

 private:
  using Dimensions = std::array<Style::Length, ordinalCount<Dimension>()>;
  using Edges = std::array<Style::Length, ordinalCount<Edge>()>;
  using Gutters = std::array<Style::Length, ordinalCount<Gutter>()>;

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
  Style::Length flexBasis_ = value::ofAuto();
  Edges margin_ = {};
  Edges position_ = {};
  Edges padding_ = {};
  Edges border_ = {};
  Gutters gap_ = {};
  Dimensions dimensions_{value::ofAuto(), value::ofAuto()};
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
  void setFlex(FloatOptional value) {
    flex_ = value;
  }

  FloatOptional flexGrow() const {
    return flexGrow_;
  }
  void setFlexGrow(FloatOptional value) {
    flexGrow_ = value;
  }

  FloatOptional flexShrink() const {
    return flexShrink_;
  }
  void setFlexShrink(FloatOptional value) {
    flexShrink_ = value;
  }

  Style::Length flexBasis() const {
    return flexBasis_;
  }
  void setFlexBasis(Style::Length value) {
    flexBasis_ = value;
  }

  Style::Length margin(Edge edge) const {
    return margin_[yoga::to_underlying(edge)];
  }
  void setMargin(Edge edge, Style::Length value) {
    margin_[yoga::to_underlying(edge)] = value;
  }

  Style::Length position(Edge edge) const {
    return position_[yoga::to_underlying(edge)];
  }
  void setPosition(Edge edge, Style::Length value) {
    position_[yoga::to_underlying(edge)] = value;
  }

  Style::Length padding(Edge edge) const {
    return padding_[yoga::to_underlying(edge)];
  }
  void setPadding(Edge edge, Style::Length value) {
    padding_[yoga::to_underlying(edge)] = value;
  }

  Style::Length border(Edge edge) const {
    return border_[yoga::to_underlying(edge)];
  }
  void setBorder(Edge edge, Style::Length value) {
    border_[yoga::to_underlying(edge)] = value;
  }

  Style::Length gap(Gutter gutter) const {
    return gap_[yoga::to_underlying(gutter)];
  }
  void setGap(Gutter gutter, Style::Length value) {
    gap_[yoga::to_underlying(gutter)] = value;
  }

  Style::Length dimension(Dimension axis) const {
    return dimensions_[yoga::to_underlying(axis)];
  }
  void setDimension(Dimension axis, Style::Length value) {
    dimensions_[yoga::to_underlying(axis)] = value;
  }

  Style::Length minDimension(Dimension axis) const {
    return minDimensions_[yoga::to_underlying(axis)];
  }
  void setMinDimension(Dimension axis, Style::Length value) {
    minDimensions_[yoga::to_underlying(axis)] = value;
  }

  Style::Length maxDimension(Dimension axis) const {
    return maxDimensions_[yoga::to_underlying(axis)];
  }
  void setMaxDimension(Dimension axis, Style::Length value) {
    maxDimensions_[yoga::to_underlying(axis)] = value;
  }

  FloatOptional aspectRatio() const {
    return aspectRatio_;
  }
  void setAspectRatio(FloatOptional value) {
    aspectRatio_ = value;
  }

  Length resolveColumnGap() const {
    if (gap_[yoga::to_underlying(Gutter::Column)].isDefined()) {
      return gap_[yoga::to_underlying(Gutter::Column)];
    } else {
      return gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  Style::Length resolveRowGap() const {
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
