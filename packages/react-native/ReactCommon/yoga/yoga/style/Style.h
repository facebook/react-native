/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cstdint>
#include <type_traits>

#include <yoga/Yoga.h>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/enums/Align.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Display.h>
#include <yoga/enums/Edge.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/Gutter.h>
#include <yoga/enums/Justify.h>
#include <yoga/enums/Overflow.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/enums/PositionType.h>
#include <yoga/enums/Unit.h>
#include <yoga/enums/Wrap.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/StyleLength.h>
#include <yoga/style/StyleValuePool.h>

namespace facebook::yoga {

class YG_EXPORT Style {
 public:
  using Length = StyleLength;

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
    return pool_.getNumber(flex_);
  }
  void setFlex(FloatOptional value) {
    pool_.store(flex_, value);
  }

  FloatOptional flexGrow() const {
    return pool_.getNumber(flexGrow_);
  }
  void setFlexGrow(FloatOptional value) {
    pool_.store(flexGrow_, value);
  }

  FloatOptional flexShrink() const {
    return pool_.getNumber(flexShrink_);
  }
  void setFlexShrink(FloatOptional value) {
    pool_.store(flexShrink_, value);
  }

  Style::Length flexBasis() const {
    return pool_.getLength(flexBasis_);
  }
  void setFlexBasis(Style::Length value) {
    pool_.store(flexBasis_, value);
  }

  Style::Length margin(Edge edge) const {
    return pool_.getLength(margin_[yoga::to_underlying(edge)]);
  }
  void setMargin(Edge edge, Style::Length value) {
    pool_.store(margin_[yoga::to_underlying(edge)], value);
  }

  Style::Length position(Edge edge) const {
    return pool_.getLength(position_[yoga::to_underlying(edge)]);
  }
  void setPosition(Edge edge, Style::Length value) {
    pool_.store(position_[yoga::to_underlying(edge)], value);
  }

  Style::Length padding(Edge edge) const {
    return pool_.getLength(padding_[yoga::to_underlying(edge)]);
  }
  void setPadding(Edge edge, Style::Length value) {
    pool_.store(padding_[yoga::to_underlying(edge)], value);
  }

  Style::Length border(Edge edge) const {
    return pool_.getLength(border_[yoga::to_underlying(edge)]);
  }
  void setBorder(Edge edge, Style::Length value) {
    pool_.store(border_[yoga::to_underlying(edge)], value);
  }

  Style::Length gap(Gutter gutter) const {
    return pool_.getLength(gap_[yoga::to_underlying(gutter)]);
  }
  void setGap(Gutter gutter, Style::Length value) {
    pool_.store(gap_[yoga::to_underlying(gutter)], value);
  }

  Style::Length dimension(Dimension axis) const {
    return pool_.getLength(dimensions_[yoga::to_underlying(axis)]);
  }
  void setDimension(Dimension axis, Style::Length value) {
    pool_.store(dimensions_[yoga::to_underlying(axis)], value);
  }

  Style::Length minDimension(Dimension axis) const {
    return pool_.getLength(minDimensions_[yoga::to_underlying(axis)]);
  }
  void setMinDimension(Dimension axis, Style::Length value) {
    pool_.store(minDimensions_[yoga::to_underlying(axis)], value);
  }

  Style::Length maxDimension(Dimension axis) const {
    return pool_.getLength(maxDimensions_[yoga::to_underlying(axis)]);
  }
  void setMaxDimension(Dimension axis, Style::Length value) {
    pool_.store(maxDimensions_[yoga::to_underlying(axis)], value);
  }

  FloatOptional aspectRatio() const {
    return pool_.getNumber(aspectRatio_);
  }
  void setAspectRatio(FloatOptional value) {
    pool_.store(aspectRatio_, value);
  }

  bool horizontalInsetsDefined() const {
    return position_[yoga::to_underlying(Edge::Left)].isDefined() ||
        position_[yoga::to_underlying(Edge::Right)].isDefined() ||
        position_[yoga::to_underlying(Edge::All)].isDefined() ||
        position_[yoga::to_underlying(Edge::Horizontal)].isDefined() ||
        position_[yoga::to_underlying(Edge::Start)].isDefined() ||
        position_[yoga::to_underlying(Edge::End)].isDefined();
  }

  bool verticalInsetsDefined() const {
    return position_[yoga::to_underlying(Edge::Top)].isDefined() ||
        position_[yoga::to_underlying(Edge::Bottom)].isDefined() ||
        position_[yoga::to_underlying(Edge::All)].isDefined() ||
        position_[yoga::to_underlying(Edge::Vertical)].isDefined();
  }

  bool isFlexStartPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(flexStartEdge(axis), direction).isDefined();
  }

  bool isFlexStartPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(flexStartEdge(axis), direction).isAuto();
  }

  bool isInlineStartPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .isDefined();
  }

  bool isInlineStartPositionAuto(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .isAuto();
  }

  bool isFlexEndPositionDefined(FlexDirection axis, Direction direction) const {
    return computePosition(flexEndEdge(axis), direction).isDefined();
  }

  bool isFlexEndPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(flexEndEdge(axis), direction).isAuto();
  }

  bool isInlineEndPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineEndEdge(axis, direction), direction)
        .isDefined();
  }

  bool isInlineEndPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(inlineEndEdge(axis, direction), direction).isAuto();
  }

  float computeFlexStartPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const {
    return computePosition(flexStartEdge(axis), direction)
        .resolve(axisSize)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineStartPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .resolve(axisSize)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexEndPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const {
    return computePosition(flexEndEdge(axis), direction)
        .resolve(axisSize)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineEndPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const {
    return computePosition(inlineEndEdge(axis, direction), direction)
        .resolve(axisSize)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexStartMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeMargin(flexStartEdge(axis), direction)
        .resolve(widthSize)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineStartMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeMargin(inlineStartEdge(axis, direction), direction)
        .resolve(widthSize)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexEndMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeMargin(flexEndEdge(axis), direction)
        .resolve(widthSize)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineEndMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeMargin(inlineEndEdge(axis, direction), direction)
        .resolve(widthSize)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexStartBorder(FlexDirection axis, Direction direction) const {
    return maxOrDefined(
        computeBorder(flexStartEdge(axis), direction).resolve(0.0f).unwrap(),
        0.0f);
  }

  float computeInlineStartBorder(FlexDirection axis, Direction direction)
      const {
    return maxOrDefined(
        computeBorder(inlineStartEdge(axis, direction), direction)
            .resolve(0.0f)
            .unwrap(),
        0.0f);
  }

  float computeFlexEndBorder(FlexDirection axis, Direction direction) const {
    return maxOrDefined(
        computeBorder(flexEndEdge(axis), direction).resolve(0.0f).unwrap(),
        0.0f);
  }

  float computeInlineEndBorder(FlexDirection axis, Direction direction) const {
    return maxOrDefined(
        computeBorder(inlineEndEdge(axis, direction), direction)
            .resolve(0.0f)
            .unwrap(),
        0.0f);
  }

  float computeFlexStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return maxOrDefined(
        computePadding(flexStartEdge(axis), direction)
            .resolve(widthSize)
            .unwrap(),
        0.0f);
  }

  float computeInlineStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return maxOrDefined(
        computePadding(inlineStartEdge(axis, direction), direction)
            .resolve(widthSize)
            .unwrap(),
        0.0f);
  }

  float computeFlexEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return maxOrDefined(
        computePadding(flexEndEdge(axis), direction)
            .resolve(widthSize)
            .unwrap(),
        0.0f);
  }

  float computeInlineEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return maxOrDefined(
        computePadding(inlineEndEdge(axis, direction), direction)
            .resolve(widthSize)
            .unwrap(),
        0.0f);
  }

  float computeInlineStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeInlineStartPadding(axis, direction, widthSize) +
        computeInlineStartBorder(axis, direction);
  }

  float computeFlexStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeFlexStartPadding(axis, direction, widthSize) +
        computeFlexStartBorder(axis, direction);
  }

  float computeInlineEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeInlineEndPadding(axis, direction, widthSize) +
        computeInlineEndBorder(axis, direction);
  }

  float computeFlexEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const {
    return computeFlexEndPadding(axis, direction, widthSize) +
        computeFlexEndBorder(axis, direction);
  }

  float computeBorderForAxis(FlexDirection axis) const {
    return computeInlineStartBorder(axis, Direction::LTR) +
        computeInlineEndBorder(axis, Direction::LTR);
  }

  float computeMarginForAxis(FlexDirection axis, float widthSize) const {
    // The total margin for a given axis does not depend on the direction
    // so hardcoding LTR here to avoid piping direction to this function
    return computeInlineStartMargin(axis, Direction::LTR, widthSize) +
        computeInlineEndMargin(axis, Direction::LTR, widthSize);
  }

  float computeGapForAxis(FlexDirection axis, float ownerSize) const {
    auto gap = isRow(axis) ? computeColumnGap() : computeRowGap();
    return maxOrDefined(gap.resolve(ownerSize).unwrap(), 0.0f);
  }

  bool flexStartMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(flexStartEdge(axis), direction).isAuto();
  }

  bool flexEndMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(flexEndEdge(axis), direction).isAuto();
  }

  bool operator==(const Style& other) const {
    return direction_ == other.direction_ &&
        flexDirection_ == other.flexDirection_ &&
        justifyContent_ == other.justifyContent_ &&
        alignContent_ == other.alignContent_ &&
        alignItems_ == other.alignItems_ && alignSelf_ == other.alignSelf_ &&
        positionType_ == other.positionType_ && flexWrap_ == other.flexWrap_ &&
        overflow_ == other.overflow_ && display_ == other.display_ &&
        numbersEqual(flex_, pool_, other.flex_, other.pool_) &&
        numbersEqual(flexGrow_, pool_, other.flexGrow_, other.pool_) &&
        numbersEqual(flexShrink_, pool_, other.flexShrink_, other.pool_) &&
        lengthsEqual(flexBasis_, pool_, other.flexBasis_, other.pool_) &&
        lengthsEqual(margin_, pool_, other.margin_, other.pool_) &&
        lengthsEqual(position_, pool_, other.position_, other.pool_) &&
        lengthsEqual(padding_, pool_, other.padding_, other.pool_) &&
        lengthsEqual(border_, pool_, other.border_, other.pool_) &&
        lengthsEqual(gap_, pool_, other.gap_, other.pool_) &&
        lengthsEqual(dimensions_, pool_, other.dimensions_, other.pool_) &&
        lengthsEqual(
               minDimensions_, pool_, other.minDimensions_, other.pool_) &&
        lengthsEqual(
               maxDimensions_, pool_, other.maxDimensions_, other.pool_) &&
        numbersEqual(aspectRatio_, pool_, other.aspectRatio_, other.pool_);
  }

  bool operator!=(const Style& other) const {
    return !(*this == other);
  }

 private:
  using Dimensions = std::array<StyleValueHandle, ordinalCount<Dimension>()>;
  using Edges = std::array<StyleValueHandle, ordinalCount<Edge>()>;
  using Gutters = std::array<StyleValueHandle, ordinalCount<Gutter>()>;

  static inline bool numbersEqual(
      const StyleValueHandle& lhsHandle,
      const StyleValuePool& lhsPool,
      const StyleValueHandle& rhsHandle,
      const StyleValuePool& rhsPool) {
    return (lhsHandle.isUndefined() && rhsHandle.isUndefined()) ||
        (lhsPool.getNumber(lhsHandle) == rhsPool.getNumber(rhsHandle));
  }

  static inline bool lengthsEqual(
      const StyleValueHandle& lhsHandle,
      const StyleValuePool& lhsPool,
      const StyleValueHandle& rhsHandle,
      const StyleValuePool& rhsPool) {
    return (lhsHandle.isUndefined() && rhsHandle.isUndefined()) ||
        (lhsPool.getLength(lhsHandle) == rhsPool.getLength(rhsHandle));
  }

  template <size_t N>
  static inline bool lengthsEqual(
      const std::array<StyleValueHandle, N>& lhs,
      const StyleValuePool& lhsPool,
      const std::array<StyleValueHandle, N>& rhs,
      const StyleValuePool& rhsPool) {
    return std::equal(
        lhs.begin(),
        lhs.end(),
        rhs.begin(),
        rhs.end(),
        [&](const auto& lhs, const auto& rhs) {
          return lengthsEqual(lhs, lhsPool, rhs, rhsPool);
        });
  }

  Style::Length computeColumnGap() const {
    if (gap_[yoga::to_underlying(Gutter::Column)].isDefined()) {
      return pool_.getLength(gap_[yoga::to_underlying(Gutter::Column)]);
    } else {
      return pool_.getLength(gap_[yoga::to_underlying(Gutter::All)]);
    }
  }

  Style::Length computeRowGap() const {
    if (gap_[yoga::to_underlying(Gutter::Row)].isDefined()) {
      return pool_.getLength(gap_[yoga::to_underlying(Gutter::Row)]);
    } else {
      return pool_.getLength(gap_[yoga::to_underlying(Gutter::All)]);
    }
  }

  Style::Length computeLeftEdge(const Edges& edges, Direction layoutDirection)
      const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Start)]);
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::End)]);
    } else if (edges[yoga::to_underlying(Edge::Left)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Left)]);
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Horizontal)]);
    } else {
      return pool_.getLength(edges[yoga::to_underlying(Edge::All)]);
    }
  }

  Style::Length computeTopEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Top)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Top)]);
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Vertical)]);
    } else {
      return pool_.getLength(edges[yoga::to_underlying(Edge::All)]);
    }
  }

  Style::Length computeRightEdge(const Edges& edges, Direction layoutDirection)
      const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::End)]);
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Start)]);
    } else if (edges[yoga::to_underlying(Edge::Right)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Right)]);
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Horizontal)]);
    } else {
      return pool_.getLength(edges[yoga::to_underlying(Edge::All)]);
    }
  }

  Style::Length computeBottomEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Bottom)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Bottom)]);
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return pool_.getLength(edges[yoga::to_underlying(Edge::Vertical)]);
    } else {
      return pool_.getLength(edges[yoga::to_underlying(Edge::All)]);
    }
  }

  Style::Length computePosition(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(position_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(position_);
      case PhysicalEdge::Right:
        return computeRightEdge(position_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(position_);
    }

    fatalWithMessage("Invalid physical edge");
  }

  Style::Length computeMargin(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(margin_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(margin_);
      case PhysicalEdge::Right:
        return computeRightEdge(margin_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(margin_);
    }

    fatalWithMessage("Invalid physical edge");
  }

  Style::Length computePadding(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(padding_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(padding_);
      case PhysicalEdge::Right:
        return computeRightEdge(padding_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(padding_);
    }

    fatalWithMessage("Invalid physical edge");
  }

  Style::Length computeBorder(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(border_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(border_);
      case PhysicalEdge::Right:
        return computeRightEdge(border_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(border_);
    }

    fatalWithMessage("Invalid physical edge");
  }

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

  StyleValueHandle flex_{};
  StyleValueHandle flexGrow_{};
  StyleValueHandle flexShrink_{};
  StyleValueHandle flexBasis_{StyleValueHandle::ofAuto()};
  Edges margin_{};
  Edges position_{};
  Edges padding_{};
  Edges border_{};
  Gutters gap_{};
  Dimensions dimensions_{
      StyleValueHandle::ofAuto(),
      StyleValueHandle::ofAuto()};
  Dimensions minDimensions_{};
  Dimensions maxDimensions_{};
  StyleValueHandle aspectRatio_{};

  StyleValuePool pool_;
};

} // namespace facebook::yoga
