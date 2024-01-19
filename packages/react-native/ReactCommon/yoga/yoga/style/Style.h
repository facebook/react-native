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
#include <yoga/style/CompactValue.h>
#include <yoga/style/StyleLength.h>

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
    return (Style::Length)flexBasis_;
  }
  void setFlexBasis(Style::Length value) {
    flexBasis_ = CompactValue(value);
  }

  Style::Length margin(Edge edge) const {
    return (Style::Length)margin_[yoga::to_underlying(edge)];
  }
  void setMargin(Edge edge, Style::Length value) {
    margin_[yoga::to_underlying(edge)] = CompactValue(value);
  }

  Style::Length position(Edge edge) const {
    return (Style::Length)position_[yoga::to_underlying(edge)];
  }
  void setPosition(Edge edge, Style::Length value) {
    position_[yoga::to_underlying(edge)] = CompactValue(value);
  }

  Style::Length padding(Edge edge) const {
    return (Style::Length)padding_[yoga::to_underlying(edge)];
  }
  void setPadding(Edge edge, Style::Length value) {
    padding_[yoga::to_underlying(edge)] = CompactValue(value);
  }

  Style::Length border(Edge edge) const {
    return (Style::Length)border_[yoga::to_underlying(edge)];
  }
  void setBorder(Edge edge, Style::Length value) {
    border_[yoga::to_underlying(edge)] = CompactValue(value);
  }

  Style::Length gap(Gutter gutter) const {
    return (Style::Length)gap_[yoga::to_underlying(gutter)];
  }
  void setGap(Gutter gutter, Style::Length value) {
    gap_[yoga::to_underlying(gutter)] = CompactValue(value);
  }

  Style::Length dimension(Dimension axis) const {
    return (Style::Length)dimensions_[yoga::to_underlying(axis)];
  }
  void setDimension(Dimension axis, Style::Length value) {
    dimensions_[yoga::to_underlying(axis)] = CompactValue(value);
  }

  Style::Length minDimension(Dimension axis) const {
    return (Style::Length)minDimensions_[yoga::to_underlying(axis)];
  }
  void setMinDimension(Dimension axis, Style::Length value) {
    minDimensions_[yoga::to_underlying(axis)] = CompactValue(value);
  }

  Style::Length maxDimension(Dimension axis) const {
    return (Style::Length)maxDimensions_[yoga::to_underlying(axis)];
  }
  void setMaxDimension(Dimension axis, Style::Length value) {
    maxDimensions_[yoga::to_underlying(axis)] = CompactValue(value);
  }

  FloatOptional aspectRatio() const {
    return aspectRatio_;
  }
  void setAspectRatio(FloatOptional value) {
    aspectRatio_ = value;
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

  bool isInlineStartPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .isDefined();
  }

  bool isFlexEndPositionDefined(FlexDirection axis, Direction direction) const {
    return computePosition(flexEndEdge(axis), direction).isDefined();
  }

  bool isInlineEndPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineEndEdge(axis, direction), direction)
        .isDefined();
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
    return computeBorder(flexStartEdge(axis), direction)
        .resolve(0.0f)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineStartBorder(FlexDirection axis, Direction direction)
      const {
    return computeBorder(inlineStartEdge(axis, direction), direction)
        .resolve(0.0f)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexEndBorder(FlexDirection axis, Direction direction) const {
    return computeBorder(flexEndEdge(axis), direction)
        .resolve(0.0f)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineEndBorder(FlexDirection axis, Direction direction) const {
    return computeBorder(inlineEndEdge(axis, direction), direction)
        .resolve(0.0f)
        .unwrapOrDefault(0.0f);
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

  float computeGapForAxis(FlexDirection axis) const {
    auto gap = isRow(axis) ? computeColumnGap() : computeRowGap();
    // TODO: Validate percentage gap, and expose ability to set percentage to
    // public API
    return maxOrDefined(gap.resolve(0.0f /*ownerSize*/).unwrap(), 0.0f);
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
  using Dimensions = std::array<CompactValue, ordinalCount<Dimension>()>;
  using Edges = std::array<CompactValue, ordinalCount<Edge>()>;
  using Gutters = std::array<CompactValue, ordinalCount<Gutter>()>;

  Style::Length computeColumnGap() const {
    if (gap_[yoga::to_underlying(Gutter::Column)].isDefined()) {
      return (Style::Length)gap_[yoga::to_underlying(Gutter::Column)];
    } else {
      return (Style::Length)gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  Style::Length computeRowGap() const {
    if (gap_[yoga::to_underlying(Gutter::Row)].isDefined()) {
      return (Style::Length)gap_[yoga::to_underlying(Gutter::Row)];
    } else {
      return (Style::Length)gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  Style::Length computeLeftEdge(const Edges& edges, Direction layoutDirection)
      const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Start)];
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::End)];
    } else if (edges[yoga::to_underlying(Edge::Left)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Left)];
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Horizontal)];
    } else {
      return (Style::Length)edges[yoga::to_underlying(Edge::All)];
    }
  }

  Style::Length computeTopEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Top)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Top)];
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Vertical)];
    } else {
      return (Style::Length)edges[yoga::to_underlying(Edge::All)];
    }
  }

  Style::Length computeRightEdge(const Edges& edges, Direction layoutDirection)
      const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::End)];
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Start)];
    } else if (edges[yoga::to_underlying(Edge::Right)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Right)];
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Horizontal)];
    } else {
      return (Style::Length)edges[yoga::to_underlying(Edge::All)];
    }
  }

  Style::Length computeBottomEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Bottom)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Bottom)];
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return (Style::Length)edges[yoga::to_underlying(Edge::Vertical)];
    } else {
      return (Style::Length)edges[yoga::to_underlying(Edge::All)];
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

  FloatOptional flex_{};
  FloatOptional flexGrow_{};
  FloatOptional flexShrink_{};
  CompactValue flexBasis_{CompactValue::ofAuto()};
  Edges margin_{};
  Edges position_{};
  Edges padding_{};
  Edges border_{};
  Gutters gap_{};
  Dimensions dimensions_{CompactValue::ofAuto(), CompactValue::ofAuto()};
  Dimensions minDimensions_{};
  Dimensions maxDimensions_{};
  FloatOptional aspectRatio_{};
};

} // namespace facebook::yoga
