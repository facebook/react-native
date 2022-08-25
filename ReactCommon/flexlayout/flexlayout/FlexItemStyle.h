/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cmath>
#include <type_traits>
#include "Dimension.h"
#include "FlexLayoutEnums.h"
#include "Utils.h"

#ifdef DEBUG
#include <iosfwd>
#endif

namespace facebook {
namespace flexlayout {
namespace style {

using namespace facebook::flexlayout;
using namespace facebook::flexlayout::utils;

class FLEX_LAYOUT_EXPORT FlexItemStyleBase {
 public:
  Float flex = NAN;
  Float flexGrow = 0;
  Float flexShrink = 1;
  // TODO T68413071 Use Aggregate initialization Dimension flexBasis{NAN,
  // Unit::Auto}
  Dimension flexBasis = Dimension(NAN, Unit::Auto);
  Float aspectRatio = NAN;
  AlignSelf alignSelf : 3;
  PositionType positionType : 2;
  Display display : 2;
  Dimension width = Dimension(NAN, Unit::Auto);
  Dimension minWidth = Dimension(NAN, Unit::Undefined);
  Dimension maxWidth = Dimension(NAN, Unit::Undefined);
  Dimension height = Dimension(NAN, Unit::Auto);
  Dimension minHeight = Dimension(NAN, Unit::Undefined);
  Dimension maxHeight = Dimension(NAN, Unit::Undefined);
  bool isReferenceBaseline = false;
  bool enableTextRounding = false;

 private:
  std::array<Dimension, 4> margin = {};
  std::array<Dimension, 4> position = {};

 public:
  FlexItemStyleBase() {
    alignSelf = AlignSelf::Auto;
    positionType = PositionType::Relative;
    display = Display::Flex;
  }

  auto getLeadingMargin(const FlexDirection axis, const Float widthSize) const
      -> Float {
    return ResolveValueMargin(getMargin(getLeadingEdge(axis)), widthSize);
  }

  auto getTrailingMargin(const FlexDirection axis, const Float widthSize) const
      -> Float {
    return ResolveValueMargin(getMargin(getTrailingEdge(axis)), widthSize);
  }

  auto getMarginForAxis(const FlexDirection axis, const Float widthSize) const
      -> Float {
    const auto marginForAxis =
        getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
    return isUndefined(marginForAxis) ? 0 : marginForAxis;
  }

  auto isFlexible() const -> bool {
    return (
        (positionType == PositionType::Relative) &&
        (flexGrow != 0 || flexShrink != 0));
  }

  auto nodeBoundAxis(
      const FlexDirection axis,
      const float value,
      const float axisSize) const -> Float {
    if (FlexDirectionIsRow(axis)) {
      return ConstraintMinMax(
          value, minWidth.resolve(axisSize), maxWidth.resolve(axisSize));
    }
    return ConstraintMinMax(
        value, minHeight.resolve(axisSize), maxHeight.resolve(axisSize));
  }

  auto marginLeadingValue(FlexDirection axis) const -> Dimension {
    return getMargin(getLeadingEdge(axis));
  }

  auto marginTrailingValue(FlexDirection axis) const -> Dimension {
    return getMargin(getTrailingEdge(axis));
  }

  auto relativePosition(const FlexDirection axis, const float axisSize) const
      -> Float {
    const float leadingPosition =
        getPosition(getLeadingEdge(axis)).resolve(axisSize);
    if (isDefined(leadingPosition)) {
      return leadingPosition;
    }

    float trailingPosition =
        getPosition(getTrailingEdge(axis)).resolve(axisSize);
    if (isDefined(trailingPosition)) {
      trailingPosition = -1 * trailingPosition;
    }
    return isUndefined(trailingPosition) ? 0 : trailingPosition;
  }

  void setFlexBasis(Float value) {
    flexBasis = Dimension(value, Unit::Point);
  }

  void setFlexBasisPercent(Float value) {
    flexBasis = Dimension(value, Unit::Percent);
  }

  void setFlexBasisAuto() {
    flexBasis = Dimension(NAN, Unit::Auto);
  }

  auto getMargin(Edge edge) const -> Dimension {
    return margin[static_cast<size_t>(edge)];
  }

  void setMargin(Edge edge, Float value) {
    margin[static_cast<size_t>(edge)] = Dimension(value, Unit::Point);
  }

  void setMarginPercent(Edge edge, Float value) {
    margin[static_cast<size_t>(edge)] = Dimension(value, Unit::Percent);
  }

  void setMarginAuto(Edge edge) {
    margin[static_cast<size_t>(edge)] = Dimension(NAN, Unit::Auto);
  }

  auto getPosition(Edge edge) const -> Dimension {
    return position[static_cast<size_t>(edge)];
  }

  void setPosition(Edge edge, Float value) {
    position[static_cast<size_t>(edge)] = Dimension(value, Unit::Point);
  }

  void setPositionPercent(Edge edge, Float value) {
    position[static_cast<size_t>(edge)] = Dimension(value, Unit::Percent);
  }

  void setWidth(Float value) {
    width = Dimension(value, Unit::Point);
  }

  void setWidthPercent(Float value) {
    width = Dimension(value, Unit::Percent);
  }

  void setWidthAuto() {
    width = Dimension(NAN, Unit::Auto);
  }

  void setMinWidth(Float value) {
    minWidth = Dimension(value, Unit::Point);
  }

  void setMinWidthPercent(Float value) {
    minWidth = Dimension(value, Unit::Percent);
  }

  void setMaxWidth(Float value) {
    maxWidth = Dimension(value, Unit::Point);
  }

  void setMaxWidthPercent(Float value) {
    maxWidth = Dimension(value, Unit::Percent);
  }

  void setHeight(Float value) {
    height = Dimension(value, Unit::Point);
  }

  void setHeightPercent(Float value) {
    height = Dimension(value, Unit::Percent);
  }

  void setHeightAuto() {
    height = Dimension(NAN, Unit::Auto);
  }

  void setMinHeight(Float value) {
    minHeight = Dimension(value, Unit::Point);
  }

  void setMinHeightPercent(Float value) {
    minHeight = Dimension(value, Unit::Percent);
  }

  void setMaxHeight(Float value) {
    maxHeight = Dimension(value, Unit::Point);
  }

  void setMaxHeightPercent(Float value) {
    maxHeight = Dimension(value, Unit::Percent);
  }
};

template <typename MeasureData, typename Result>
struct FLEX_LAYOUT_EXPORT FlexItemStyle : public FlexItemStyleBase {
  using MeasureFunction = MeasureOutput<Result> (*)(
      const MeasureData& measureData,
      const Float minWidth,
      const Float maxWidth,
      const Float minHeight,
      const Float maxHeight,
      const Float ownerWidth,
      const Float ownerHeight);

  using BaselineFunction = Float (*)(
      const MeasureData& baselineData,
      const Float width,
      const Float height);

  MeasureFunction measureFunction = {nullptr};
  BaselineFunction baselineFunction = {nullptr};
  // Measure data set by the UI Framework, this is returned back in measure
  // function callback. This is required to connect multiple sub trees together.
  MeasureData measureData;
};

#ifndef __OBJC__
// Non-ObjC code will recieve a pointer to const in the measure / baseline
// function
template <typename MeasureData>
using PtrToConstIfNotObjC = const MeasureData*;
#else
// Code that uses ObjC types for measure data will receive a non-const pointer
// in the measure / baseline function since const doesn't do much for ObjC types
// (and makes it outright impossible to declare a function that accepts a
// pointer to const id or id<Protocol>)
template <typename MeasureData>
using PtrToConstIfNotObjC = std::conditional_t<
    std::is_convertible<MeasureData*, id>::value,
    MeasureData*,
    const MeasureData*>;
#endif

template <typename MeasureData, typename Result>
struct FLEX_LAYOUT_EXPORT FlexItemStyle<MeasureData*, Result>
    : public FlexItemStyleBase {
  using MeasureFunction = MeasureOutput<Result> (*)(
      PtrToConstIfNotObjC<MeasureData> measureData,
      const Float minWidth,
      const Float maxWidth,
      const Float minHeight,
      const Float maxHeight,
      const Float ownerWidth,
      const Float ownerHeight);

  using BaselineFunction = Float (*)(
      PtrToConstIfNotObjC<MeasureData> baselineData,
      const Float width,
      const Float height);

  MeasureFunction measureFunction = nullptr;
  BaselineFunction baselineFunction = nullptr;
  PtrToConstIfNotObjC<MeasureData> measureData = nullptr;
};

#ifdef DEBUG
auto operator<<(std::ostream& os, const FlexItemStyleBase& style)
    -> std::ostream&;
#endif

} // namespace style
} // namespace flexlayout
} // namespace facebook
