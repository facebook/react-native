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

  Direction direction() const {
    return direction_;
  }
  void setDirection(Direction value) {
    direction_ = value;
  }

  FlexDirection flexDirection() const {
    return flexDirection_;
  }
  void setFlexDirection(FlexDirection value) {
    flexDirection_ = value;
  }

  Justify justifyContent() const {
    return justifyContent_;
  }
  void setJustifyContent(Justify value) {
    justifyContent_ = value;
  }

  Align alignContent() const {
    return alignContent_;
  }
  void setAlignContent(Align value) {
    alignContent_ = value;
  }

  Align alignItems() const {
    return alignItems_;
  }
  void setAlignItems(Align value) {
    alignItems_ = value;
  }

  Align alignSelf() const {
    return alignSelf_;
  }
  void setAlignSelf(Align value) {
    alignSelf_ = value;
  }

  PositionType positionType() const {
    return positionType_;
  }
  void setPositionType(PositionType value) {
    positionType_ = value;
  }

  Wrap flexWrap() const {
    return flexWrap_;
  }
  void setFlexWrap(Wrap value) {
    flexWrap_ = value;
  }

  Overflow overflow() const {
    return overflow_;
  }
  void setOverflow(Overflow value) {
    overflow_ = value;
  }

  Display display() const {
    return display_;
  }
  void setDisplay(Display value) {
    display_ = value;
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

  bool horizontalInsetsDefined() const {
    return position_[YGEdge::YGEdgeLeft].isDefined() ||
        position_[YGEdge::YGEdgeRight].isDefined() ||
        position_[YGEdge::YGEdgeAll].isDefined() ||
        position_[YGEdge::YGEdgeHorizontal].isDefined() ||
        position_[YGEdge::YGEdgeStart].isDefined() ||
        position_[YGEdge::YGEdgeEnd].isDefined();
  }

  bool verticalInsetsDefined() const {
    return position_[YGEdge::YGEdgeTop].isDefined() ||
        position_[YGEdge::YGEdgeBottom].isDefined() ||
        position_[YGEdge::YGEdgeAll].isDefined() ||
        position_[YGEdge::YGEdgeVertical].isDefined();
  }

  bool operator==(const Style& other) const {
    return direction_ == other.direction_ &&
        flexDirection_ == other.flexDirection_ &&
        justifyContent_ == other.justifyContent_ &&
        alignContent_ == other.alignContent_ &&
        alignItems_ == other.alignItems_ && alignSelf_ == other.alignSelf_ &&
        positionType_ == other.positionType_ && flexWrap_ == other.flexWrap_ &&
        overflow_ == other.overflow_ && display_ == other.display_ &&
        inexactEquals(flex_, other.flex_) &&
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

 private:
  using Dimensions = std::array<Style::Length, ordinalCount<Dimension>()>;
  using Edges = std::array<Style::Length, ordinalCount<Edge>()>;
  using Gutters = std::array<Style::Length, ordinalCount<Gutter>()>;

  Direction direction_ : bitCount<Direction>() = Direction::Inherit;
  FlexDirection flexDirection_
      : bitCount<FlexDirection>() = FlexDirection::Column;
  Justify justifyContent_ : bitCount<Justify>() = Justify::FlexStart;
  Align alignContent_ : bitCount<Align>() = Align::FlexStart;
  Align alignItems_ : bitCount<Align>() = Align::Stretch;
  Align alignSelf_ : bitCount<Align>() = Align::Auto;
  PositionType positionType_
      : bitCount<PositionType>() = PositionType::Relative;
  Wrap flexWrap_ : bitCount<Wrap>() = Wrap::NoWrap;
  Overflow overflow_ : bitCount<Overflow>() = Overflow::Visible;
  Display display_ : bitCount<Display>() = Display::Flex;

  FloatOptional flex_{};
  FloatOptional flexGrow_{};
  FloatOptional flexShrink_{};
  Style::Length flexBasis_{value::ofAuto()};
  Edges margin_{};
  Edges position_{};
  Edges padding_{};
  Edges border_{};
  Gutters gap_{};
  Dimensions dimensions_{value::ofAuto(), value::ofAuto()};
  Dimensions minDimensions_{};
  Dimensions maxDimensions_{};
  FloatOptional aspectRatio_{};
};

} // namespace facebook::yoga
