/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <atomic>
#include <cfloat>
#include <cmath>
#include <cstring>

#include <yoga/Yoga.h>

#include <yoga/algorithm/Align.h>
#include <yoga/algorithm/Baseline.h>
#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/Cache.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/FlexLine.h>
#include <yoga/algorithm/PixelGrid.h>
#include <yoga/algorithm/ResolveValue.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/debug/Log.h>
#include <yoga/debug/NodeToString.h>
#include <yoga/event/event.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/Comparison.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

std::atomic<uint32_t> gCurrentGenerationCount(0);

bool calculateLayoutInternal(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const Direction ownerDirection,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount);

static inline float dimensionWithMargin(
    const yoga::Node* const node,
    const FlexDirection axis,
    const float widthSize) {
  return node->getLayout().measuredDimension(dimension(axis)) +
      (node->getLeadingMargin(axis, widthSize) +
       node->getTrailingMargin(axis, widthSize))
          .unwrap();
}

static inline bool styleDefinesDimension(
    const yoga::Node* const node,
    const FlexDirection axis,
    const float ownerSize) {
  bool isUndefined =
      yoga::isUndefined(node->getResolvedDimension(dimension(axis)).value);

  auto resolvedDimension = node->getResolvedDimension(dimension(axis));
  return !(
      resolvedDimension.unit == YGUnitAuto ||
      resolvedDimension.unit == YGUnitUndefined ||
      (resolvedDimension.unit == YGUnitPoint && !isUndefined &&
       resolvedDimension.value < 0.0f) ||
      (resolvedDimension.unit == YGUnitPercent && !isUndefined &&
       (resolvedDimension.value < 0.0f || yoga::isUndefined(ownerSize))));
}

static inline bool isLayoutDimensionDefined(
    const yoga::Node* const node,
    const FlexDirection axis) {
  const float value = node->getLayout().measuredDimension(dimension(axis));
  return !yoga::isUndefined(value) && value >= 0.0f;
}

static void setChildTrailingPosition(
    const yoga::Node* const node,
    yoga::Node* const child,
    const FlexDirection axis) {
  const float size = child->getLayout().measuredDimension(dimension(axis));
  child->setLayoutPosition(
      node->getLayout().measuredDimension(dimension(axis)) - size -
          child->getLayout().position[leadingEdge(axis)],
      trailingEdge(axis));
}

static void constrainMaxSizeForMode(
    const yoga::Node* const node,
    const enum FlexDirection axis,
    const float ownerAxisSize,
    const float ownerWidth,
    MeasureMode* mode,
    float* size) {
  const FloatOptional maxSize =
      yoga::resolveValue(
          node->getStyle().maxDimension(dimension(axis)), ownerAxisSize) +
      FloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case MeasureMode::Exactly:
    case MeasureMode::AtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.unwrap())
          ? *size
          : maxSize.unwrap();
      break;
    case MeasureMode::Undefined:
      if (!maxSize.isUndefined()) {
        *mode = MeasureMode::AtMost;
        *size = maxSize.unwrap();
      }
      break;
  }
}

static void computeFlexBasisForChild(
    const yoga::Node* const node,
    yoga::Node* const child,
    const float width,
    const MeasureMode widthMode,
    const float height,
    const float ownerWidth,
    const float ownerHeight,
    const MeasureMode heightMode,
    const Direction direction,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  const FlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const bool isMainAxisRow = isRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  MeasureMode childWidthMeasureMode;
  MeasureMode childHeightMeasureMode;

  const FloatOptional resolvedFlexBasis =
      yoga::resolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined =
      styleDefinesDimension(child, FlexDirection::Row, ownerWidth);
  const bool isColumnStyleDimDefined =
      styleDefinesDimension(child, FlexDirection::Column, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !yoga::isUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (child->getConfig()->isExperimentalFeatureEnabled(
             ExperimentalFeature::WebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration != generationCount)) {
      const FloatOptional paddingAndBorder =
          FloatOptional(paddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          yoga::maxOrDefined(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const FloatOptional paddingAndBorder = FloatOptional(
        paddingAndBorderForAxis(child, FlexDirection::Row, ownerWidth));

    child->setLayoutComputedFlexBasis(yoga::maxOrDefined(
        yoga::resolveValue(
            child->getResolvedDimension(YGDimensionWidth), ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const FloatOptional paddingAndBorder = FloatOptional(
        paddingAndBorderForAxis(child, FlexDirection::Column, ownerWidth));
    child->setLayoutComputedFlexBasis(yoga::maxOrDefined(
        yoga::resolveValue(
            child->getResolvedDimension(YGDimensionHeight), ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = MeasureMode::Undefined;
    childHeightMeasureMode = MeasureMode::Undefined;

    auto marginRow =
        child->getMarginForAxis(FlexDirection::Row, ownerWidth).unwrap();
    auto marginColumn =
        child->getMarginForAxis(FlexDirection::Column, ownerWidth).unwrap();

    if (isRowStyleDimDefined) {
      childWidth =
          yoga::resolveValue(
              child->getResolvedDimension(YGDimensionWidth), ownerWidth)
              .unwrap() +
          marginRow;
      childWidthMeasureMode = MeasureMode::Exactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          yoga::resolveValue(
              child->getResolvedDimension(YGDimensionHeight), ownerHeight)
              .unwrap() +
          marginColumn;
      childHeightMeasureMode = MeasureMode::Exactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property, but all
    // major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow() == Overflow::Scroll) ||
        node->getStyle().overflow() != Overflow::Scroll) {
      if (yoga::isUndefined(childWidth) && !yoga::isUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = MeasureMode::AtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow() == Overflow::Scroll) ||
        node->getStyle().overflow() != Overflow::Scroll) {
      if (yoga::isUndefined(childHeight) && !yoga::isUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = MeasureMode::AtMost;
      }
    }

    const auto& childStyle = child->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == MeasureMode::Exactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = MeasureMode::Exactly;
      } else if (
          isMainAxisRow && childHeightMeasureMode == MeasureMode::Exactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = MeasureMode::Exactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch, set
    // the cross axis to be measured exactly with the available inner width

    const bool hasExactWidth =
        !yoga::isUndefined(width) && widthMode == MeasureMode::Exactly;
    const bool childWidthStretch =
        resolveChildAlignment(node, child) == Align::Stretch &&
        childWidthMeasureMode != MeasureMode::Exactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth &&
        childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = MeasureMode::Exactly;
      if (!childStyle.aspectRatio().isUndefined()) {
        childHeight =
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = MeasureMode::Exactly;
      }
    }

    const bool hasExactHeight =
        !yoga::isUndefined(height) && heightMode == MeasureMode::Exactly;
    const bool childHeightStretch =
        resolveChildAlignment(node, child) == Align::Stretch &&
        childHeightMeasureMode != MeasureMode::Exactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight &&
        childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = MeasureMode::Exactly;

      if (!childStyle.aspectRatio().isUndefined()) {
        childWidth =
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = MeasureMode::Exactly;
      }
    }

    constrainMaxSizeForMode(
        child,
        FlexDirection::Row,
        ownerWidth,
        ownerWidth,
        &childWidthMeasureMode,
        &childWidth);
    constrainMaxSizeForMode(
        child,
        FlexDirection::Column,
        ownerHeight,
        ownerWidth,
        &childHeightMeasureMode,
        &childHeight);

    // Measure the child
    calculateLayoutInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        ownerWidth,
        ownerHeight,
        false,
        LayoutPassReason::kMeasureChild,
        layoutMarkerData,
        depth,
        generationCount);

    child->setLayoutComputedFlexBasis(FloatOptional(yoga::maxOrDefined(
        child->getLayout().measuredDimension(dimension(mainAxis)),
        paddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(generationCount);
}

static void layoutAbsoluteChild(
    const yoga::Node* const node,
    yoga::Node* const child,
    const float width,
    const MeasureMode widthMode,
    const float height,
    const Direction direction,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  const FlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const FlexDirection crossAxis = resolveCrossDirection(mainAxis, direction);
  const bool isMainAxisRow = isRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  MeasureMode childWidthMeasureMode = MeasureMode::Undefined;
  MeasureMode childHeightMeasureMode = MeasureMode::Undefined;

  auto marginRow = child->getMarginForAxis(FlexDirection::Row, width).unwrap();
  auto marginColumn =
      child->getMarginForAxis(FlexDirection::Column, width).unwrap();

  if (styleDefinesDimension(child, FlexDirection::Row, width)) {
    childWidth =
        yoga::resolveValue(child->getResolvedDimension(YGDimensionWidth), width)
            .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->isLeadingPositionDefined(FlexDirection::Row) &&
        child->isTrailingPosDefined(FlexDirection::Row)) {
      childWidth = node->getLayout().measuredDimension(YGDimensionWidth) -
          (node->getLeadingBorder(FlexDirection::Row) +
           node->getTrailingBorder(FlexDirection::Row)) -
          (child->getLeadingPosition(FlexDirection::Row, width) +
           child->getTrailingPosition(FlexDirection::Row, width))
              .unwrap();
      childWidth =
          boundAxis(child, FlexDirection::Row, childWidth, width, width);
    }
  }

  if (styleDefinesDimension(child, FlexDirection::Column, height)) {
    childHeight = yoga::resolveValue(
                      child->getResolvedDimension(YGDimensionHeight), height)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based on
    // the top/bottom offsets if they're defined.
    if (child->isLeadingPositionDefined(FlexDirection::Column) &&
        child->isTrailingPosDefined(FlexDirection::Column)) {
      childHeight = node->getLayout().measuredDimension(YGDimensionHeight) -
          (node->getLeadingBorder(FlexDirection::Column) +
           node->getTrailingBorder(FlexDirection::Column)) -
          (child->getLeadingPosition(FlexDirection::Column, height) +
           child->getTrailingPosition(FlexDirection::Column, height))
              .unwrap();
      childHeight =
          boundAxis(child, FlexDirection::Column, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const auto& childStyle = child->getStyle();
  if (yoga::isUndefined(childWidth) ^ yoga::isUndefined(childHeight)) {
    if (!childStyle.aspectRatio().isUndefined()) {
      if (yoga::isUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
      } else if (yoga::isUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (yoga::isUndefined(childWidth) || yoga::isUndefined(childHeight)) {
    childWidthMeasureMode = yoga::isUndefined(childWidth)
        ? MeasureMode::Undefined
        : MeasureMode::Exactly;
    childHeightMeasureMode = yoga::isUndefined(childHeight)
        ? MeasureMode::Undefined
        : MeasureMode::Exactly;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && yoga::isUndefined(childWidth) &&
        widthMode != MeasureMode::Undefined && !yoga::isUndefined(width) &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = MeasureMode::AtMost;
    }

    calculateLayoutInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        childWidth,
        childHeight,
        false,
        LayoutPassReason::kAbsMeasureChild,
        layoutMarkerData,
        depth,
        generationCount);
    childWidth = child->getLayout().measuredDimension(YGDimensionWidth) +
        child->getMarginForAxis(FlexDirection::Row, width).unwrap();
    childHeight = child->getLayout().measuredDimension(YGDimensionHeight) +
        child->getMarginForAxis(FlexDirection::Column, width).unwrap();
  }

  calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      MeasureMode::Exactly,
      MeasureMode::Exactly,
      childWidth,
      childHeight,
      true,
      LayoutPassReason::kAbsLayout,
      layoutMarkerData,
      depth,
      generationCount);

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimension(dimension(mainAxis)) -
            child->getLayout().measuredDimension(dimension(mainAxis)) -
            node->getTrailingBorder(mainAxis) -
            child->getTrailingMargin(mainAxis, isMainAxisRow ? width : height)
                .unwrap() -
            child->getTrailingPosition(mainAxis, isMainAxisRow ? width : height)
                .unwrap(),
        leadingEdge(mainAxis));
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == Justify::Center) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimension(dimension(mainAxis)) -
         child->getLayout().measuredDimension(dimension(mainAxis))) /
            2.0f,
        leadingEdge(mainAxis));
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == Justify::FlexEnd) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimension(dimension(mainAxis)) -
         child->getLayout().measuredDimension(dimension(mainAxis))),
        leadingEdge(mainAxis));
  } else if (
      node->getConfig()->isExperimentalFeatureEnabled(
          ExperimentalFeature::AbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 mainAxis,
                 node->getLayout().measuredDimension(dimension(mainAxis)))
                .unwrap() +
            node->getLeadingBorder(mainAxis) +
            child
                ->getLeadingMargin(
                    mainAxis,
                    node->getLayout().measuredDimension(dimension(mainAxis)))
                .unwrap(),
        leadingEdge(mainAxis));
  }

  if (child->isTrailingPosDefined(crossAxis) &&
      !child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimension(dimension(crossAxis)) -
            child->getLayout().measuredDimension(dimension(crossAxis)) -
            node->getTrailingBorder(crossAxis) -
            child->getTrailingMargin(crossAxis, isMainAxisRow ? height : width)
                .unwrap() -
            child
                ->getTrailingPosition(crossAxis, isMainAxisRow ? height : width)
                .unwrap(),
        leadingEdge(crossAxis));

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      resolveChildAlignment(node, child) == Align::Center) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimension(dimension(crossAxis)) -
         child->getLayout().measuredDimension(dimension(crossAxis))) /
            2.0f,
        leadingEdge(crossAxis));
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((resolveChildAlignment(node, child) == Align::FlexEnd) ^
       (node->getStyle().flexWrap() == Wrap::WrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimension(dimension(crossAxis)) -
         child->getLayout().measuredDimension(dimension(crossAxis))),
        leadingEdge(crossAxis));
  } else if (
      node->getConfig()->isExperimentalFeatureEnabled(
          ExperimentalFeature::AbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 crossAxis,
                 node->getLayout().measuredDimension(dimension(crossAxis)))
                .unwrap() +
            node->getLeadingBorder(crossAxis) +
            child
                ->getLeadingMargin(
                    crossAxis,
                    node->getLayout().measuredDimension(dimension(crossAxis)))
                .unwrap(),
        leadingEdge(crossAxis));
  }
}

static void measureNodeWithMeasureFunc(
    yoga::Node* const node,
    float availableWidth,
    float availableHeight,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    LayoutData& layoutMarkerData,
    const LayoutPassReason reason) {
  yoga::assertFatalWithNode(
      node,
      node->hasMeasureFunc(),
      "Expected node to have custom measure function");

  if (widthMeasureMode == MeasureMode::Undefined) {
    availableWidth = YGUndefined;
  }
  if (heightMeasureMode == MeasureMode::Undefined) {
    availableHeight = YGUndefined;
  }

  const auto& padding = node->getLayout().padding;
  const auto& border = node->getLayout().border;
  const float paddingAndBorderAxisRow = padding[YGEdgeLeft] +
      padding[YGEdgeRight] + border[YGEdgeLeft] + border[YGEdgeRight];
  const float paddingAndBorderAxisColumn = padding[YGEdgeTop] +
      padding[YGEdgeBottom] + border[YGEdgeTop] + border[YGEdgeBottom];

  // We want to make sure we don't call measure with negative size
  const float innerWidth = yoga::isUndefined(availableWidth)
      ? availableWidth
      : yoga::maxOrDefined(0, availableWidth - paddingAndBorderAxisRow);
  const float innerHeight = yoga::isUndefined(availableHeight)
      ? availableHeight
      : yoga::maxOrDefined(0, availableHeight - paddingAndBorderAxisColumn);

  if (widthMeasureMode == MeasureMode::Exactly &&
      heightMeasureMode == MeasureMode::Exactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node, FlexDirection::Row, availableWidth, ownerWidth, ownerWidth),
        YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            FlexDirection::Column,
            availableHeight,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
  } else {
    Event::publish<Event::MeasureCallbackStart>(node);

    // Measure the text under the current constraints.
    const YGSize measuredSize = node->measure(
        innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    layoutMarkerData.measureCallbacks += 1;
    layoutMarkerData.measureCallbackReasonsCount[static_cast<size_t>(reason)] +=
        1;

    Event::publish<Event::MeasureCallbackEnd>(
        node,
        {innerWidth,
         unscopedEnum(widthMeasureMode),
         innerHeight,
         unscopedEnum(heightMeasureMode),
         measuredSize.width,
         measuredSize.height,
         reason});

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            FlexDirection::Row,
            (widthMeasureMode == MeasureMode::Undefined ||
             widthMeasureMode == MeasureMode::AtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            FlexDirection::Column,
            (heightMeasureMode == MeasureMode::Undefined ||
             heightMeasureMode == MeasureMode::AtMost)
                ? measuredSize.height + paddingAndBorderAxisColumn
                : availableHeight,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void measureNodeWithoutChildren(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  const auto& padding = node->getLayout().padding;
  const auto& border = node->getLayout().border;

  float width = availableWidth;
  if (widthMeasureMode == MeasureMode::Undefined ||
      widthMeasureMode == MeasureMode::AtMost) {
    width = padding[YGEdgeLeft] + padding[YGEdgeRight] + border[YGEdgeLeft] +
        border[YGEdgeRight];
  }
  node->setLayoutMeasuredDimension(
      boundAxis(node, FlexDirection::Row, width, ownerWidth, ownerWidth),
      YGDimensionWidth);

  float height = availableHeight;
  if (heightMeasureMode == MeasureMode::Undefined ||
      heightMeasureMode == MeasureMode::AtMost) {
    height = padding[YGEdgeTop] + padding[YGEdgeBottom] + border[YGEdgeTop] +
        border[YGEdgeBottom];
  }
  node->setLayoutMeasuredDimension(
      boundAxis(node, FlexDirection::Column, height, ownerHeight, ownerWidth),
      YGDimensionHeight);
}

static bool measureNodeWithFixedSize(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  if ((!yoga::isUndefined(availableWidth) &&
       widthMeasureMode == MeasureMode::AtMost && availableWidth <= 0.0f) ||
      (!yoga::isUndefined(availableHeight) &&
       heightMeasureMode == MeasureMode::AtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == MeasureMode::Exactly &&
       heightMeasureMode == MeasureMode::Exactly)) {
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            FlexDirection::Row,
            yoga::isUndefined(availableWidth) ||
                    (widthMeasureMode == MeasureMode::AtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            FlexDirection::Column,
            yoga::isUndefined(availableHeight) ||
                    (heightMeasureMode == MeasureMode::AtMost &&
                     availableHeight < 0.0f)
                ? 0.0f
                : availableHeight,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
    return true;
  }

  return false;
}

static void zeroOutLayoutRecursively(yoga::Node* const node) {
  node->getLayout() = {};
  node->setLayoutDimension(0, YGDimensionWidth);
  node->setLayoutDimension(0, YGDimensionHeight);
  node->setHasNewLayout(true);

  node->cloneChildrenIfNeeded();
  for (const auto child : node->getChildren()) {
    zeroOutLayoutRecursively(child);
  }
}

static float calculateAvailableInnerDimension(
    const yoga::Node* const node,
    const YGDimension dimension,
    const float availableDim,
    const float paddingAndBorder,
    const float ownerDim) {
  float availableInnerDim = availableDim - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (!yoga::isUndefined(availableInnerDim)) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const FloatOptional minDimensionOptional =
        yoga::resolveValue(node->getStyle().minDimension(dimension), ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.unwrap() - paddingAndBorder;

    const FloatOptional maxDimensionOptional =
        yoga::resolveValue(node->getStyle().maxDimension(dimension), ownerDim);

    const float maxInnerDim = maxDimensionOptional.isUndefined()
        ? FLT_MAX
        : maxDimensionOptional.unwrap() - paddingAndBorder;
    availableInnerDim = yoga::maxOrDefined(
        yoga::minOrDefined(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

static float computeFlexBasisForChildren(
    yoga::Node* const node,
    const float availableInnerWidth,
    const float availableInnerHeight,
    MeasureMode widthMeasureMode,
    MeasureMode heightMeasureMode,
    Direction direction,
    FlexDirection mainAxis,
    bool performLayout,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  float totalOuterFlexBasis = 0.0f;
  YGNodeRef singleFlexChild = nullptr;
  const auto& children = node->getChildren();
  MeasureMode measureModeMainDim =
      isRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == MeasureMode::Exactly) {
    for (auto child : children) {
      if (child->isNodeFlexible()) {
        if (singleFlexChild != nullptr ||
            yoga::inexactEquals(child->resolveFlexGrow(), 0.0f) ||
            yoga::inexactEquals(child->resolveFlexShrink(), 0.0f)) {
          // There is already a flexible child, or this flexible child doesn't
          // have flexGrow and flexShrink, abort
          singleFlexChild = nullptr;
          break;
        } else {
          singleFlexChild = child;
        }
      }
    }
  }

  for (auto child : children) {
    child->resolveDimension();
    if (child->getStyle().display() == Display::None) {
      zeroOutLayoutRecursively(child);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const Direction childDirection = child->resolveDirection(direction);
      const float mainDim =
          isRow(mainAxis) ? availableInnerWidth : availableInnerHeight;
      const float crossDim =
          isRow(mainAxis) ? availableInnerHeight : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType() == PositionType::Absolute) {
      continue;
    }
    if (child == singleFlexChild) {
      child->setLayoutComputedFlexBasisGeneration(generationCount);
      child->setLayoutComputedFlexBasis(FloatOptional(0));
    } else {
      computeFlexBasisForChild(
          node,
          child,
          availableInnerWidth,
          widthMeasureMode,
          availableInnerHeight,
          availableInnerWidth,
          availableInnerHeight,
          heightMeasureMode,
          direction,
          layoutMarkerData,
          depth,
          generationCount);
    }

    totalOuterFlexBasis +=
        (child->getLayout().computedFlexBasis +
         child->getMarginForAxis(mainAxis, availableInnerWidth))
            .unwrap();
  }

  return totalOuterFlexBasis;
}

// It distributes the free space to the flexible items and ensures that the size
// of the flex items abide the min and max constraints. At the end of this
// function the child nodes would have proper size. Prior using this function
// please ensure that distributeFreeSpaceFirstPass is called.
static float distributeFreeSpaceSecondPass(
    FlexLine& flexLine,
    yoga::Node* const node,
    const FlexDirection mainAxis,
    const FlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const MeasureMode measureModeCrossDim,
    const bool performLayout,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = isRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != Wrap::NoWrap;

  for (auto currentLineChild : flexLine.itemsInFlow) {
    childFlexBasis = boundAxisWithinMinAndMax(
                         currentLineChild,
                         mainAxis,
                         currentLineChild->getLayout().computedFlexBasis,
                         mainAxisownerSize)
                         .unwrap();
    float updatedMainSize = childFlexBasis;

    if (!yoga::isUndefined(flexLine.layout.remainingFreeSpace) &&
        flexLine.layout.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentLineChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!yoga::isUndefined(flexLine.layout.totalFlexShrinkScaledFactors) &&
            flexLine.layout.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (flexLine.layout.remainingFreeSpace /
               flexLine.layout.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = boundAxis(
            currentLineChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !yoga::isUndefined(flexLine.layout.remainingFreeSpace) &&
        flexLine.layout.remainingFreeSpace > 0) {
      flexGrowFactor = currentLineChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!std::isnan(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = boundAxis(
            currentLineChild,
            mainAxis,
            childFlexBasis +
                flexLine.layout.remainingFreeSpace /
                    flexLine.layout.totalFlexGrowFactors * flexGrowFactor,
            availableInnerMainDim,
            availableInnerWidth);
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const float marginMain =
        currentLineChild->getMarginForAxis(mainAxis, availableInnerWidth)
            .unwrap();
    const float marginCross =
        currentLineChild->getMarginForAxis(crossAxis, availableInnerWidth)
            .unwrap();

    float childCrossSize;
    float childMainSize = updatedMainSize + marginMain;
    MeasureMode childCrossMeasureMode;
    MeasureMode childMainMeasureMode = MeasureMode::Exactly;

    const auto& childStyle = currentLineChild->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      childCrossSize = isMainAxisRow
          ? (childMainSize - marginMain) / childStyle.aspectRatio().unwrap()
          : (childMainSize - marginMain) * childStyle.aspectRatio().unwrap();
      childCrossMeasureMode = MeasureMode::Exactly;

      childCrossSize += marginCross;
    } else if (
        !std::isnan(availableInnerCrossDim) &&
        !styleDefinesDimension(
            currentLineChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == MeasureMode::Exactly &&
        !(isNodeFlexWrap && mainAxisOverflows) &&
        resolveChildAlignment(node, currentLineChild) == Align::Stretch &&
        currentLineChild->marginLeadingValue(crossAxis).unit != YGUnitAuto &&
        currentLineChild->marginTrailingValue(crossAxis).unit != YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = MeasureMode::Exactly;
    } else if (!styleDefinesDimension(
                   currentLineChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = yoga::isUndefined(childCrossSize)
          ? MeasureMode::Undefined
          : MeasureMode::AtMost;
    } else {
      childCrossSize =
          yoga::resolveValue(
              currentLineChild->getResolvedDimension(dimension(crossAxis)),
              availableInnerCrossDim)
              .unwrap() +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentLineChild->getResolvedDimension(dimension(crossAxis)).unit ==
              YGUnitPercent &&
          measureModeCrossDim != MeasureMode::Exactly;
      childCrossMeasureMode =
          yoga::isUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? MeasureMode::Undefined
          : MeasureMode::Exactly;
    }

    constrainMaxSizeForMode(
        currentLineChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    constrainMaxSizeForMode(
        currentLineChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !styleDefinesDimension(
            currentLineChild, crossAxis, availableInnerCrossDim) &&
        resolveChildAlignment(node, currentLineChild) == Align::Stretch &&
        currentLineChild->marginLeadingValue(crossAxis).unit != YGUnitAuto &&
        currentLineChild->marginTrailingValue(crossAxis).unit != YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const MeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const MeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    const bool isLayoutPass = performLayout && !requiresStretchLayout;
    // Recursively call the layout algorithm for this child with the updated
    // main size.
    calculateLayoutInternal(
        currentLineChild,
        childWidth,
        childHeight,
        node->getLayout().direction(),
        childWidthMeasureMode,
        childHeightMeasureMode,
        availableInnerWidth,
        availableInnerHeight,
        isLayoutPass,
        isLayoutPass ? LayoutPassReason::kFlexLayout
                     : LayoutPassReason::kFlexMeasure,
        layoutMarkerData,
        depth,
        generationCount);
    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() ||
        currentLineChild->getLayout().hadOverflow());
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void distributeFreeSpaceFirstPass(
    FlexLine& flexLine,
    const FlexDirection mainAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerWidth) {
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float baseMainSize = 0;
  float boundMainSize = 0;
  float deltaFreeSpace = 0;

  for (auto currentLineChild : flexLine.itemsInFlow) {
    float childFlexBasis = boundAxisWithinMinAndMax(
                               currentLineChild,
                               mainAxis,
                               currentLineChild->getLayout().computedFlexBasis,
                               mainAxisownerSize)
                               .unwrap();

    if (flexLine.layout.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentLineChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!yoga::isUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            flexLine.layout.remainingFreeSpace /
                flexLine.layout.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = boundAxis(
            currentLineChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);
        if (!yoga::isUndefined(baseMainSize) &&
            !yoga::isUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          flexLine.layout.totalFlexShrinkScaledFactors -=
              (-currentLineChild->resolveFlexShrink() *
               currentLineChild->getLayout().computedFlexBasis.unwrap());
        }
      }
    } else if (
        !yoga::isUndefined(flexLine.layout.remainingFreeSpace) &&
        flexLine.layout.remainingFreeSpace > 0) {
      flexGrowFactor = currentLineChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!yoga::isUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            flexLine.layout.remainingFreeSpace /
                flexLine.layout.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = boundAxis(
            currentLineChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);

        if (!yoga::isUndefined(baseMainSize) &&
            !yoga::isUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          flexLine.layout.totalFlexGrowFactors -= flexGrowFactor;
        }
      }
    }
  }
  flexLine.layout.remainingFreeSpace -= deltaFreeSpace;
}

// Do two passes over the flex items to figure out how to distribute the
// remaining space.
//
// The first pass finds the items whose min/max constraints trigger, freezes
// them at those sizes, and excludes those sizes from the remaining space.
//
// The second pass sets the size of each flexible item. It distributes the
// remaining space amongst the items whose min/max constraints didn't trigger in
// the first pass. For the other items, it sets their sizes by forcing their
// min/max constraints to trigger again.
//
// This two pass approach for resolving min/max constraints deviates from the
// spec. The spec
// (https://www.w3.org/TR/CSS-flexbox-1/#resolve-flexible-lengths) describes a
// process that needs to be repeated a variable number of times. The algorithm
// implemented here won't handle all cases but it was simpler to implement and
// it mitigates performance concerns because we know exactly how many passes
// it'll do.
//
// At the end of this function the child nodes would have the proper size
// assigned to them.
//
static void resolveFlexibleLength(
    yoga::Node* const node,
    FlexLine& flexLine,
    const FlexDirection mainAxis,
    const FlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const MeasureMode measureModeCrossDim,
    const bool performLayout,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  const float originalFreeSpace = flexLine.layout.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  distributeFreeSpaceFirstPass(
      flexLine,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = distributeFreeSpaceSecondPass(
      flexLine,
      node,
      mainAxis,
      crossAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerCrossDim,
      availableInnerWidth,
      availableInnerHeight,
      mainAxisOverflows,
      measureModeCrossDim,
      performLayout,
      layoutMarkerData,
      depth,
      generationCount);

  flexLine.layout.remainingFreeSpace = originalFreeSpace - distributedFreeSpace;
}

static void justifyMainAxis(
    yoga::Node* const node,
    FlexLine& flexLine,
    const size_t startOfLineIndex,
    const FlexDirection mainAxis,
    const FlexDirection crossAxis,
    const MeasureMode measureModeMainDim,
    const MeasureMode measureModeCrossDim,
    const float mainAxisownerSize,
    const float ownerWidth,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const bool performLayout) {
  const auto& style = node->getStyle();
  const float leadingPaddingAndBorderMain =
      node->getLeadingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  const float trailingPaddingAndBorderMain =
      node->getTrailingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  const float gap = node->getGapForAxis(mainAxis, ownerWidth).unwrap();
  // If we are using "at most" rules in the main axis, make sure that
  // remainingFreeSpace is 0 when min main dimension is not given
  if (measureModeMainDim == MeasureMode::AtMost &&
      flexLine.layout.remainingFreeSpace > 0) {
    if (!style.minDimension(dimension(mainAxis)).isUndefined() &&
        !yoga::resolveValue(
             style.minDimension(dimension(mainAxis)), mainAxisownerSize)
             .isUndefined()) {
      // This condition makes sure that if the size of main dimension(after
      // considering child nodes main dim, leading and trailing padding etc)
      // falls below min dimension, then the remainingFreeSpace is reassigned
      // considering the min dimension

      // `minAvailableMainDim` denotes minimum available space in which child
      // can be laid out, it will exclude space consumed by padding and border.
      const float minAvailableMainDim =
          yoga::resolveValue(
              style.minDimension(dimension(mainAxis)), mainAxisownerSize)
              .unwrap() -
          leadingPaddingAndBorderMain - trailingPaddingAndBorderMain;
      const float occupiedSpaceByChildNodes =
          availableInnerMainDim - flexLine.layout.remainingFreeSpace;
      flexLine.layout.remainingFreeSpace = yoga::maxOrDefined(
          0, minAvailableMainDim - occupiedSpaceByChildNodes);
    } else {
      flexLine.layout.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (size_t i = startOfLineIndex; i < flexLine.endOfLineIndex; i++) {
    auto child = node->getChild(i);
    if (child->getStyle().positionType() != PositionType::Absolute) {
      if (child->marginLeadingValue(mainAxis).unit == YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
      if (child->marginTrailingValue(mainAxis).unit == YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
    }
  }

  // In order to position the elements in the main axis, we have two controls.
  // The space between the beginning and the first element and the space between
  // each two elements.
  float leadingMainDim = 0;
  float betweenMainDim = gap;
  const Justify justifyContent = node->getStyle().justifyContent();

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case Justify::Center:
        leadingMainDim = flexLine.layout.remainingFreeSpace / 2;
        break;
      case Justify::FlexEnd:
        leadingMainDim = flexLine.layout.remainingFreeSpace;
        break;
      case Justify::SpaceBetween:
        if (flexLine.itemsInFlow.size() > 1) {
          betweenMainDim +=
              yoga::maxOrDefined(flexLine.layout.remainingFreeSpace, 0) /
              static_cast<float>(flexLine.itemsInFlow.size() - 1);
        }
        break;
      case Justify::SpaceEvenly:
        // Space is distributed evenly across all elements
        leadingMainDim = flexLine.layout.remainingFreeSpace /
            static_cast<float>(flexLine.itemsInFlow.size() + 1);
        betweenMainDim += leadingMainDim;
        break;
      case Justify::SpaceAround:
        // Space on the edges is half of the space between elements
        leadingMainDim = 0.5f * flexLine.layout.remainingFreeSpace /
            static_cast<float>(flexLine.itemsInFlow.size());
        betweenMainDim += leadingMainDim * 2;
        break;
      case Justify::FlexStart:
        break;
    }
  }

  flexLine.layout.mainDim = leadingPaddingAndBorderMain + leadingMainDim;
  flexLine.layout.crossDim = 0;

  float maxAscentForCurrentLine = 0;
  float maxDescentForCurrentLine = 0;
  bool isNodeBaselineLayout = isBaselineLayout(node);
  for (size_t i = startOfLineIndex; i < flexLine.endOfLineIndex; i++) {
    const auto child = node->getChild(i);
    const Style& childStyle = child->getStyle();
    const LayoutResults& childLayout = child->getLayout();
    if (childStyle.display() == Display::None) {
      continue;
    }
    if (childStyle.positionType() == PositionType::Absolute &&
        child->isLeadingPositionDefined(mainAxis)) {
      if (performLayout) {
        // In case the child is position absolute and has left/top being
        // defined, we override the position to whatever the user said (and
        // margin/border).
        child->setLayoutPosition(
            child->getLeadingPosition(mainAxis, availableInnerMainDim)
                    .unwrap() +
                node->getLeadingBorder(mainAxis) +
                child->getLeadingMargin(mainAxis, availableInnerWidth).unwrap(),
            leadingEdge(mainAxis));
      }
    } else {
      // Now that we placed the element, we need to update the variables.
      // We need to do that only for relative elements. Absolute elements do not
      // take part in that phase.
      if (childStyle.positionType() != PositionType::Absolute) {
        if (child->marginLeadingValue(mainAxis).unit == YGUnitAuto) {
          flexLine.layout.mainDim += flexLine.layout.remainingFreeSpace /
              static_cast<float>(numberOfAutoMarginsOnCurrentLine);
        }

        if (performLayout) {
          child->setLayoutPosition(
              childLayout.position[leadingEdge(mainAxis)] +
                  flexLine.layout.mainDim,
              leadingEdge(mainAxis));
        }

        if (child != flexLine.itemsInFlow.back()) {
          flexLine.layout.mainDim += betweenMainDim;
        }

        if (child->marginTrailingValue(mainAxis).unit == YGUnitAuto) {
          flexLine.layout.mainDim += flexLine.layout.remainingFreeSpace /
              static_cast<float>(numberOfAutoMarginsOnCurrentLine);
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == MeasureMode::Exactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the measuredDims
          // because they weren't computed. This means we can't call
          // dimensionWithMargin.
          flexLine.layout.mainDim +=
              child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap() +
              childLayout.computedFlexBasis.unwrap();
          flexLine.layout.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          flexLine.layout.mainDim +=
              dimensionWithMargin(child, mainAxis, availableInnerWidth);

          if (isNodeBaselineLayout) {
            // If the child is baseline aligned then the cross dimension is
            // calculated by adding maxAscent and maxDescent from the baseline.
            const float ascent = calculateBaseline(child) +
                child
                    ->getLeadingMargin(
                        FlexDirection::Column, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimension(YGDimensionHeight) +
                child
                    ->getMarginForAxis(
                        FlexDirection::Column, availableInnerWidth)
                    .unwrap() -
                ascent;

            maxAscentForCurrentLine =
                yoga::maxOrDefined(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                yoga::maxOrDefined(maxDescentForCurrentLine, descent);
          } else {
            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension in the case
            // when the items are not baseline aligned
            flexLine.layout.crossDim = yoga::maxOrDefined(
                flexLine.layout.crossDim,
                dimensionWithMargin(child, crossAxis, availableInnerWidth));
          }
        }
      } else if (performLayout) {
        child->setLayoutPosition(
            childLayout.position[leadingEdge(mainAxis)] +
                node->getLeadingBorder(mainAxis) + leadingMainDim,
            leadingEdge(mainAxis));
      }
    }
  }
  flexLine.layout.mainDim += trailingPaddingAndBorderMain;

  if (isNodeBaselineLayout) {
    flexLine.layout.crossDim =
        maxAscentForCurrentLine + maxDescentForCurrentLine;
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm described in the W3C CSS documentation:
// https://www.w3.org/TR/CSS3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//    which are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//    are stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//    defined by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//    'collapse' and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//    bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//    minimum main size. For text blocks, for example, this is the width of the
//    widest word. Calculating the minimum width is expensive, so we forego it
//    and assume a default minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//    lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//    but the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and laid out
//    - availableWidth & availableHeight: available size to be used for sizing
//      the node or YGUndefined if the size is not available; interpretation
//      depends on layout flags
//    - ownerDirection: the inline (text) direction within the owner
//      (left-to-right or right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//      for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//      for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//      dimensions of the node or it requires the entire node and its subtree to
//      be laid out (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the information in node.style, which is treated as a
//    read-only input. It is responsible for setting the layout.direction and
//    layout.measuredDimensions fields for the input node as well as the
//    layout.position and layout.lineIndex fields for its child nodes. The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min content", and "fit content". Of these, we don't use "min
//    content" because we don't support default minimum main sizes (see above
//    for details). Each of our measure modes maps to a layout mode from the
//    spec (https://www.w3.org/TR/CSS3-sizing/#terms):
//      - MeasureMode::Undefined: max content
//      - MeasureMode::Exactly: fill available
//      - MeasureMode::AtMost: fit content
//
//    When calling calculateLayoutImpl and calculateLayoutInternal, if the
//    caller passes an available size of undefined then it must also pass a
//    measure mode of MeasureMode::Undefined in that dimension.
//
static void calculateLayoutImpl(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const Direction ownerDirection,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount,
    const LayoutPassReason reason) {
  yoga::assertFatalWithNode(
      node,
      yoga::isUndefined(availableWidth)
          ? widthMeasureMode == MeasureMode::Undefined
          : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "MeasureMode::Undefined");
  yoga::assertFatalWithNode(
      node,
      yoga::isUndefined(availableHeight)
          ? heightMeasureMode == MeasureMode::Undefined
          : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "MeasureMode::Undefined");

  (performLayout ? layoutMarkerData.layouts : layoutMarkerData.measures) += 1;

  // Set the resolved resolution in the node's layout.
  const Direction direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const FlexDirection flexRowDirection =
      resolveDirection(FlexDirection::Row, direction);
  const FlexDirection flexColumnDirection =
      resolveDirection(FlexDirection::Column, direction);

  const YGEdge startEdge =
      direction == Direction::LTR ? YGEdgeLeft : YGEdgeRight;
  const YGEdge endEdge = direction == Direction::LTR ? YGEdgeRight : YGEdgeLeft;

  const float marginRowLeading =
      node->getLeadingMargin(flexRowDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginRowLeading, startEdge);
  const float marginRowTrailing =
      node->getTrailingMargin(flexRowDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginRowTrailing, endEdge);
  const float marginColumnLeading =
      node->getLeadingMargin(flexColumnDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginColumnLeading, YGEdgeTop);
  const float marginColumnTrailing =
      node->getTrailingMargin(flexColumnDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginColumnTrailing, YGEdgeBottom);

  const float marginAxisRow = marginRowLeading + marginRowTrailing;
  const float marginAxisColumn = marginColumnLeading + marginColumnTrailing;

  node->setLayoutBorder(node->getLeadingBorder(flexRowDirection), startEdge);
  node->setLayoutBorder(node->getTrailingBorder(flexRowDirection), endEdge);
  node->setLayoutBorder(node->getLeadingBorder(flexColumnDirection), YGEdgeTop);
  node->setLayoutBorder(
      node->getTrailingBorder(flexColumnDirection), YGEdgeBottom);

  node->setLayoutPadding(
      node->getLeadingPadding(flexRowDirection, ownerWidth).unwrap(),
      startEdge);
  node->setLayoutPadding(
      node->getTrailingPadding(flexRowDirection, ownerWidth).unwrap(), endEdge);
  node->setLayoutPadding(
      node->getLeadingPadding(flexColumnDirection, ownerWidth).unwrap(),
      YGEdgeTop);
  node->setLayoutPadding(
      node->getTrailingPadding(flexColumnDirection, ownerWidth).unwrap(),
      YGEdgeBottom);

  if (node->hasMeasureFunc()) {
    measureNodeWithMeasureFunc(
        node,
        availableWidth - marginAxisRow,
        availableHeight - marginAxisColumn,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        layoutMarkerData,
        reason);
    return;
  }

  const auto childCount = node->getChildCount();
  if (childCount == 0) {
    measureNodeWithoutChildren(
        node,
        availableWidth - marginAxisRow,
        availableHeight - marginAxisColumn,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm
  // if we already know the size
  if (!performLayout &&
      measureNodeWithFixedSize(
          node,
          availableWidth - marginAxisRow,
          availableHeight - marginAxisColumn,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight)) {
    return;
  }

  // At this point we know we're going to perform work. Ensure that each child
  // has a mutable copy.
  node->cloneChildrenIfNeeded();
  // Reset layout flags, as they could have changed.
  node->setLayoutHadOverflow(false);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const FlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const FlexDirection crossAxis = resolveCrossDirection(mainAxis, direction);
  const bool isMainAxisRow = isRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != Wrap::NoWrap;

  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const float crossAxisownerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const float paddingAndBorderAxisMain =
      paddingAndBorderForAxis(node, mainAxis, ownerWidth);
  const float leadingPaddingAndBorderCross =
      node->getLeadingPaddingAndBorder(crossAxis, ownerWidth).unwrap();
  const float trailingPaddingAndBorderCross =
      node->getTrailingPaddingAndBorder(crossAxis, ownerWidth).unwrap();
  const float paddingAndBorderAxisCross =
      leadingPaddingAndBorderCross + trailingPaddingAndBorderCross;

  MeasureMode measureModeMainDim =
      isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  MeasureMode measureModeCrossDim =
      isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  float availableInnerWidth = calculateAvailableInnerDimension(
      node,
      YGDimensionWidth,
      availableWidth - marginAxisRow,
      paddingAndBorderAxisRow,
      ownerWidth);
  float availableInnerHeight = calculateAvailableInnerDimension(
      node,
      YGDimensionHeight,
      availableHeight - marginAxisColumn,
      paddingAndBorderAxisColumn,
      ownerHeight);

  float availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim =
      isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  // Computed basis + margins + gap
  float totalMainDim = 0;
  totalMainDim += computeFlexBasisForChildren(
      node,
      availableInnerWidth,
      availableInnerHeight,
      widthMeasureMode,
      heightMeasureMode,
      direction,
      mainAxis,
      performLayout,
      layoutMarkerData,
      depth,
      generationCount);

  if (childCount > 1) {
    totalMainDim +=
        node->getGapForAxis(mainAxis, availableInnerCrossDim).unwrap() *
        static_cast<float>(childCount - 1);
  }

  const bool mainAxisOverflows =
      (measureModeMainDim != MeasureMode::Undefined) &&
      totalMainDim > availableInnerMainDim;

  if (isNodeFlexWrap && mainAxisOverflows &&
      measureModeMainDim == MeasureMode::AtMost) {
    measureModeMainDim = MeasureMode::Exactly;
  }
  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  size_t startOfLineIndex = 0;
  size_t endOfLineIndex = 0;

  // Number of lines.
  size_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  const float crossAxisGap =
      node->getGapForAxis(crossAxis, availableInnerCrossDim).unwrap();

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    auto flexLine = calculateFlexLine(
        node,
        ownerDirection,
        mainAxisownerSize,
        availableInnerWidth,
        availableInnerMainDim,
        startOfLineIndex,
        lineCount);

    endOfLineIndex = flexLine.endOfLineIndex;

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex =
        !performLayout && measureModeCrossDim == MeasureMode::Exactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated. If
    // the main dimension size isn't known, it is computed based on the line
    // length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (measureModeMainDim != MeasureMode::Exactly) {
      const auto& style = node->getStyle();
      const float minInnerWidth =
          yoga::resolveValue(style.minDimension(YGDimensionWidth), ownerWidth)
              .unwrap() -
          paddingAndBorderAxisRow;
      const float maxInnerWidth =
          yoga::resolveValue(style.maxDimension(YGDimensionWidth), ownerWidth)
              .unwrap() -
          paddingAndBorderAxisRow;
      const float minInnerHeight =
          yoga::resolveValue(style.minDimension(YGDimensionHeight), ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;
      const float maxInnerHeight =
          yoga::resolveValue(style.maxDimension(YGDimensionHeight), ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;

      const float minInnerMainDim =
          isMainAxisRow ? minInnerWidth : minInnerHeight;
      const float maxInnerMainDim =
          isMainAxisRow ? maxInnerWidth : maxInnerHeight;

      if (!yoga::isUndefined(minInnerMainDim) &&
          flexLine.sizeConsumed < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !yoga::isUndefined(maxInnerMainDim) &&
          flexLine.sizeConsumed > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        bool useLegacyStretchBehaviour =
            node->hasErrata(Errata::StretchFlexBasis);

        if (!useLegacyStretchBehaviour &&
            ((!yoga::isUndefined(flexLine.layout.totalFlexGrowFactors) &&
              flexLine.layout.totalFlexGrowFactors == 0) ||
             (!yoga::isUndefined(node->resolveFlexGrow()) &&
              node->resolveFlexGrow() == 0))) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim = flexLine.sizeConsumed;
        }

        sizeBasedOnContent = !useLegacyStretchBehaviour;
      }
    }

    if (!sizeBasedOnContent && !yoga::isUndefined(availableInnerMainDim)) {
      flexLine.layout.remainingFreeSpace =
          availableInnerMainDim - flexLine.sizeConsumed;
    } else if (flexLine.sizeConsumed < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its content. sizeConsumed is negative which means
      // the node will allocate 0 points for its content. Consequently,
      // remainingFreeSpace is 0 - sizeConsumed.
      flexLine.layout.remainingFreeSpace = -flexLine.sizeConsumed;
    }

    if (!canSkipFlex) {
      resolveFlexibleLength(
          node,
          flexLine,
          mainAxis,
          crossAxis,
          mainAxisownerSize,
          availableInnerMainDim,
          availableInnerCrossDim,
          availableInnerWidth,
          availableInnerHeight,
          mainAxisOverflows,
          measureModeCrossDim,
          performLayout,
          layoutMarkerData,
          depth,
          generationCount);
    }

    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() |
        (flexLine.layout.remainingFreeSpace < 0));

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis. Their dimensions are also set in the cross axis with the exception
    // of items that are aligned "stretch". We need to compute these stretch
    // values and set the final positions.

    justifyMainAxis(
        node,
        flexLine,
        startOfLineIndex,
        mainAxis,
        crossAxis,
        measureModeMainDim,
        measureModeCrossDim,
        mainAxisownerSize,
        ownerWidth,
        availableInnerMainDim,
        availableInnerCrossDim,
        availableInnerWidth,
        performLayout);

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == MeasureMode::Undefined ||
        measureModeCrossDim == MeasureMode::AtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          boundAxis(
              node,
              crossAxis,
              flexLine.layout.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == MeasureMode::Exactly) {
      flexLine.layout.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    flexLine.layout.crossDim =
        boundAxis(
            node,
            crossAxis,
            flexLine.layout.crossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth) -
        paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (size_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const auto child = node->getChild(i);
        if (child->getStyle().display() == Display::None) {
          continue;
        }
        if (child->getStyle().positionType() == PositionType::Absolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right set, override all the previously computed
          // positions to set it correctly.
          const bool isChildLeadingPosDefined =
              child->isLeadingPositionDefined(crossAxis);
          if (isChildLeadingPosDefined) {
            child->setLayoutPosition(
                child->getLeadingPosition(crossAxis, availableInnerCrossDim)
                        .unwrap() +
                    node->getLeadingBorder(crossAxis) +
                    child->getLeadingMargin(crossAxis, availableInnerWidth)
                        .unwrap(),
                leadingEdge(crossAxis));
          }
          // If leading position is not defined or calculations result in Nan,
          // default to border + margin
          if (!isChildLeadingPosDefined ||
              yoga::isUndefined(
                  child->getLayout().position[leadingEdge(crossAxis)])) {
            child->setLayoutPosition(
                node->getLeadingBorder(crossAxis) +
                    child->getLeadingMargin(crossAxis, availableInnerWidth)
                        .unwrap(),
                leadingEdge(crossAxis));
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (owner) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const Align alignItem = resolveChildAlignment(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time forcing the cross-axis size to be the computed
          // cross size for the current line.
          if (alignItem == Align::Stretch &&
              child->marginLeadingValue(crossAxis).unit != YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!styleDefinesDimension(
                    child, crossAxis, availableInnerCrossDim)) {
              float childMainSize =
                  child->getLayout().measuredDimension(dimension(mainAxis));
              const auto& childStyle = child->getStyle();
              float childCrossSize = !childStyle.aspectRatio().isUndefined()
                  ? child->getMarginForAxis(crossAxis, availableInnerWidth)
                          .unwrap() +
                      (isMainAxisRow
                           ? childMainSize / childStyle.aspectRatio().unwrap()
                           : childMainSize * childStyle.aspectRatio().unwrap())
                  : flexLine.layout.crossDim;

              childMainSize +=
                  child->getMarginForAxis(mainAxis, availableInnerWidth)
                      .unwrap();

              MeasureMode childMainMeasureMode = MeasureMode::Exactly;
              MeasureMode childCrossMeasureMode = MeasureMode::Exactly;
              constrainMaxSizeForMode(
                  child,
                  mainAxis,
                  availableInnerMainDim,
                  availableInnerWidth,
                  &childMainMeasureMode,
                  &childMainSize);
              constrainMaxSizeForMode(
                  child,
                  crossAxis,
                  availableInnerCrossDim,
                  availableInnerWidth,
                  &childCrossMeasureMode,
                  &childCrossSize);

              const float childWidth =
                  isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight =
                  !isMainAxisRow ? childMainSize : childCrossSize;

              auto alignContent = node->getStyle().alignContent();
              auto crossAxisDoesNotGrow =
                  alignContent != Align::Stretch && isNodeFlexWrap;
              const MeasureMode childWidthMeasureMode =
                  yoga::isUndefined(childWidth) ||
                      (!isMainAxisRow && crossAxisDoesNotGrow)
                  ? MeasureMode::Undefined
                  : MeasureMode::Exactly;
              const MeasureMode childHeightMeasureMode =
                  yoga::isUndefined(childHeight) ||
                      (isMainAxisRow && crossAxisDoesNotGrow)
                  ? MeasureMode::Undefined
                  : MeasureMode::Exactly;

              calculateLayoutInternal(
                  child,
                  childWidth,
                  childHeight,
                  direction,
                  childWidthMeasureMode,
                  childHeightMeasureMode,
                  availableInnerWidth,
                  availableInnerHeight,
                  true,
                  LayoutPassReason::kStretch,
                  layoutMarkerData,
                  depth,
                  generationCount);
            }
          } else {
            const float remainingCrossDim = containerCrossAxis -
                dimensionWithMargin(child, crossAxis, availableInnerWidth);

            if (child->marginLeadingValue(crossAxis).unit == YGUnitAuto &&
                child->marginTrailingValue(crossAxis).unit == YGUnitAuto) {
              leadingCrossDim +=
                  yoga::maxOrDefined(0.0f, remainingCrossDim / 2);
            } else if (
                child->marginTrailingValue(crossAxis).unit == YGUnitAuto) {
              // No-Op
            } else if (
                child->marginLeadingValue(crossAxis).unit == YGUnitAuto) {
              leadingCrossDim += yoga::maxOrDefined(0.0f, remainingCrossDim);
            } else if (alignItem == Align::FlexStart) {
              // No-Op
            } else if (alignItem == Align::Center) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->setLayoutPosition(
              child->getLayout().position[leadingEdge(crossAxis)] +
                  totalLineCrossDim + leadingCrossDim,
              leadingEdge(crossAxis));
        }
      }
    }

    const float appliedCrossGap = lineCount != 0 ? crossAxisGap : 0.0f;
    totalLineCrossDim += flexLine.layout.crossDim + appliedCrossGap;
    maxLineMainDim =
        yoga::maxOrDefined(maxLineMainDim, flexLine.layout.mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  // currentLead stores the size of the cross dim
  if (performLayout && (isNodeFlexWrap || isBaselineLayout(node))) {
    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;
    if (!yoga::isUndefined(availableInnerCrossDim)) {
      const float remainingAlignContentDim =
          availableInnerCrossDim - totalLineCrossDim;
      switch (node->getStyle().alignContent()) {
        case Align::FlexEnd:
          currentLead += remainingAlignContentDim;
          break;
        case Align::Center:
          currentLead += remainingAlignContentDim / 2;
          break;
        case Align::Stretch:
          if (availableInnerCrossDim > totalLineCrossDim) {
            crossDimLead =
                remainingAlignContentDim / static_cast<float>(lineCount);
          }
          break;
        case Align::SpaceAround:
          if (availableInnerCrossDim > totalLineCrossDim) {
            currentLead +=
                remainingAlignContentDim / (2 * static_cast<float>(lineCount));
            if (lineCount > 1) {
              crossDimLead =
                  remainingAlignContentDim / static_cast<float>(lineCount);
            }
          } else {
            currentLead += remainingAlignContentDim / 2;
          }
          break;
        case Align::SpaceBetween:
          if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            crossDimLead =
                remainingAlignContentDim / static_cast<float>(lineCount - 1);
          }
          break;
        case Align::Auto:
        case Align::FlexStart:
        case Align::Baseline:
          break;
      }
    }
    size_t endIndex = 0;
    for (size_t i = 0; i < lineCount; i++) {
      const size_t startIndex = endIndex;
      size_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const auto child = node->getChild(ii);
        if (child->getStyle().display() == Display::None) {
          continue;
        }
        if (child->getStyle().positionType() != PositionType::Absolute) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (isLayoutDimensionDefined(child, crossAxis)) {
            lineHeight = yoga::maxOrDefined(
                lineHeight,
                child->getLayout().measuredDimension(dimension(crossAxis)) +
                    child->getMarginForAxis(crossAxis, availableInnerWidth)
                        .unwrap());
          }
          if (resolveChildAlignment(node, child) == Align::Baseline) {
            const float ascent = calculateBaseline(child) +
                child
                    ->getLeadingMargin(
                        FlexDirection::Column, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimension(YGDimensionHeight) +
                child
                    ->getMarginForAxis(
                        FlexDirection::Column, availableInnerWidth)
                    .unwrap() -
                ascent;
            maxAscentForCurrentLine =
                yoga::maxOrDefined(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                yoga::maxOrDefined(maxDescentForCurrentLine, descent);
            lineHeight = yoga::maxOrDefined(
                lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;
      currentLead += i != 0 ? crossAxisGap : 0;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const auto child = node->getChild(ii);
          if (child->getStyle().display() == Display::None) {
            continue;
          }
          if (child->getStyle().positionType() != PositionType::Absolute) {
            switch (resolveChildAlignment(node, child)) {
              case Align::FlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    leadingEdge(crossAxis));
                break;
              }
              case Align::FlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        child->getTrailingMargin(crossAxis, availableInnerWidth)
                            .unwrap() -
                        child->getLayout().measuredDimension(
                            dimension(crossAxis)),
                    leadingEdge(crossAxis));
                break;
              }
              case Align::Center: {
                float childHeight =
                    child->getLayout().measuredDimension(dimension(crossAxis));

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    leadingEdge(crossAxis));
                break;
              }
              case Align::Stretch: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    leadingEdge(crossAxis));

                // Remeasure child with the line height as it as been only
                // measured with the owners height yet.
                if (!styleDefinesDimension(
                        child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout().measuredDimension(
                             YGDimensionWidth) +
                         child->getMarginForAxis(mainAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout().measuredDimension(
                             YGDimensionHeight) +
                         child->getMarginForAxis(crossAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  if (!(yoga::inexactEquals(
                            childWidth,
                            child->getLayout().measuredDimension(
                                YGDimensionWidth)) &&
                        yoga::inexactEquals(
                            childHeight,
                            child->getLayout().measuredDimension(
                                YGDimensionHeight)))) {
                    calculateLayoutInternal(
                        child,
                        childWidth,
                        childHeight,
                        direction,
                        MeasureMode::Exactly,
                        MeasureMode::Exactly,
                        availableInnerWidth,
                        availableInnerHeight,
                        true,
                        LayoutPassReason::kMultilineStretch,
                        layoutMarkerData,
                        depth,
                        generationCount);
                  }
                }
                break;
              }
              case Align::Baseline: {
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine -
                        calculateBaseline(child) +
                        child
                            ->getLeadingPosition(
                                FlexDirection::Column, availableInnerCrossDim)
                            .unwrap(),
                    YGEdgeTop);

                break;
              }
              case Align::Auto:
              case Align::SpaceBetween:
              case Align::SpaceAround:
                break;
            }
          }
        }
      }
      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS

  node->setLayoutMeasuredDimension(
      boundAxis(
          node,
          FlexDirection::Row,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      boundAxis(
          node,
          FlexDirection::Column,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == MeasureMode::Undefined ||
      (node->getStyle().overflow() != Overflow::Scroll &&
       measureModeMainDim == MeasureMode::AtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dimension(mainAxis));

  } else if (
      measureModeMainDim == MeasureMode::AtMost &&
      node->getStyle().overflow() == Overflow::Scroll) {
    node->setLayoutMeasuredDimension(
        yoga::maxOrDefined(
            yoga::minOrDefined(
                availableInnerMainDim + paddingAndBorderAxisMain,
                boundAxisWithinMinAndMax(
                    node,
                    mainAxis,
                    FloatOptional{maxLineMainDim},
                    mainAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisMain),
        dimension(mainAxis));
  }

  if (measureModeCrossDim == MeasureMode::Undefined ||
      (node->getStyle().overflow() != Overflow::Scroll &&
       measureModeCrossDim == MeasureMode::AtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dimension(crossAxis));

  } else if (
      measureModeCrossDim == MeasureMode::AtMost &&
      node->getStyle().overflow() == Overflow::Scroll) {
    node->setLayoutMeasuredDimension(
        yoga::maxOrDefined(
            yoga::minOrDefined(
                availableInnerCrossDim + paddingAndBorderAxisCross,
                boundAxisWithinMinAndMax(
                    node,
                    crossAxis,
                    FloatOptional{
                        totalLineCrossDim + paddingAndBorderAxisCross},
                    crossAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisCross),
        dimension(crossAxis));
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap() == Wrap::WrapReverse) {
    for (size_t i = 0; i < childCount; i++) {
      const auto child = node->getChild(i);
      if (child->getStyle().positionType() != PositionType::Absolute) {
        child->setLayoutPosition(
            node->getLayout().measuredDimension(dimension(crossAxis)) -
                child->getLayout().position[leadingEdge(crossAxis)] -
                child->getLayout().measuredDimension(dimension(crossAxis)),
            leadingEdge(crossAxis));
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (auto child : node->getChildren()) {
      if (child->getStyle().display() == Display::None ||
          child->getStyle().positionType() != PositionType::Absolute) {
        continue;
      }
      const bool absolutePercentageAgainstPaddingEdge =
          node->getConfig()->isExperimentalFeatureEnabled(
              ExperimentalFeature::AbsolutePercentageAgainstPaddingEdge);

      layoutAbsoluteChild(
          node,
          child,
          absolutePercentageAgainstPaddingEdge
              ? node->getLayout().measuredDimension(YGDimensionWidth)
              : availableInnerWidth,
          isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
          absolutePercentageAgainstPaddingEdge
              ? node->getLayout().measuredDimension(YGDimensionHeight)
              : availableInnerHeight,
          direction,
          layoutMarkerData,
          depth,
          generationCount);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos = mainAxis == FlexDirection::RowReverse ||
        mainAxis == FlexDirection::ColumnReverse;
    const bool needsCrossTrailingPos = crossAxis == FlexDirection::RowReverse ||
        crossAxis == FlexDirection::ColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (size_t i = 0; i < childCount; i++) {
        const auto child = node->getChild(i);
        if (child->getStyle().display() == Display::None) {
          continue;
        }
        if (needsMainTrailingPos) {
          setChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer =
    "                                                            ";

static const char* spacerWithLength(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char* measureModeName(
    const MeasureMode mode,
    const bool performLayout) {
  switch (mode) {
    case MeasureMode::Undefined:
      return performLayout ? "LAY_UNDEFINED" : "UNDEFINED";
    case MeasureMode::Exactly:
      return performLayout ? "LAY_EXACTLY" : "EXACTLY";
    case MeasureMode::AtMost:
      return performLayout ? "LAY_AT_MOST" : "AT_MOST";
  }
  return "";
}

//
// This is a wrapper around the calculateLayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as calculateLayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool calculateLayoutInternal(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const Direction ownerDirection,
    const MeasureMode widthMeasureMode,
    const MeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    LayoutData& layoutMarkerData,
    uint32_t depth,
    const uint32_t generationCount) {
  LayoutResults* layout = &node->getLayout();

  depth++;

  const bool needToVisitNode =
      (node->isDirty() && layout->generationCount != generationCount) ||
      layout->lastOwnerDirection != ownerDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.availableWidth = -1;
    layout->cachedLayout.availableHeight = -1;
    layout->cachedLayout.widthMeasureMode = MeasureMode::Undefined;
    layout->cachedLayout.heightMeasureMode = MeasureMode::Undefined;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  CachedMeasurement* cachedResults = nullptr;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions and dimensions for nodes in the subtree. The algorithm assumes
  // that each node gets laid out a maximum of one time per tree layout, but
  // multiple measurements may be required to resolve all of the flex
  // dimensions. We handle nodes with measure functions specially here because
  // they are the most expensive to measure, so it's worth avoiding redundant
  // measurements if at all possible.
  if (node->hasMeasureFunc()) {
    const float marginAxisRow =
        node->getMarginForAxis(FlexDirection::Row, ownerWidth).unwrap();
    const float marginAxisColumn =
        node->getMarginForAxis(FlexDirection::Column, ownerWidth).unwrap();

    // First, try to use the layout cache.
    if (canUseCachedMeasurement(
            widthMeasureMode,
            availableWidth,
            heightMeasureMode,
            availableHeight,
            layout->cachedLayout.widthMeasureMode,
            layout->cachedLayout.availableWidth,
            layout->cachedLayout.heightMeasureMode,
            layout->cachedLayout.availableHeight,
            layout->cachedLayout.computedWidth,
            layout->cachedLayout.computedHeight,
            marginAxisRow,
            marginAxisColumn,
            node->getConfig())) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (size_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (canUseCachedMeasurement(
                widthMeasureMode,
                availableWidth,
                heightMeasureMode,
                availableHeight,
                layout->cachedMeasurements[i].widthMeasureMode,
                layout->cachedMeasurements[i].availableWidth,
                layout->cachedMeasurements[i].heightMeasureMode,
                layout->cachedMeasurements[i].availableHeight,
                layout->cachedMeasurements[i].computedWidth,
                layout->cachedMeasurements[i].computedHeight,
                marginAxisRow,
                marginAxisColumn,
                node->getConfig())) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (yoga::inexactEquals(
            layout->cachedLayout.availableWidth, availableWidth) &&
        yoga::inexactEquals(
            layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (yoga::inexactEquals(
              layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          yoga::inexactEquals(
              layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode ==
              heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != nullptr) {
    layout->setMeasuredDimension(
        YGDimensionWidth, cachedResults->computedWidth);
    layout->setMeasuredDimension(
        YGDimensionHeight, cachedResults->computedHeight);

    (performLayout ? layoutMarkerData.cachedLayouts
                   : layoutMarkerData.cachedMeasures) += 1;

    if (gPrintChanges && gPrintSkips) {
      yoga::log(
          node,
          LogLevel::Verbose,
          "%s%d.{[skipped] ",
          spacerWithLength(depth),
          depth);
      node->print();
      yoga::log(
          node,
          LogLevel::Verbose,
          "wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          measureModeName(widthMeasureMode, performLayout),
          measureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          cachedResults->computedWidth,
          cachedResults->computedHeight,
          LayoutPassReasonToString(reason));
    }
  } else {
    if (gPrintChanges) {
      yoga::log(
          node,
          LogLevel::Verbose,
          "%s%d.{%s",
          spacerWithLength(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print();
      yoga::log(
          node,
          LogLevel::Verbose,
          "wm: %s, hm: %s, aw: %f ah: %f %s\n",
          measureModeName(widthMeasureMode, performLayout),
          measureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          LayoutPassReasonToString(reason));
    }

    calculateLayoutImpl(
        node,
        availableWidth,
        availableHeight,
        ownerDirection,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        performLayout,
        layoutMarkerData,
        depth,
        generationCount,
        reason);

    if (gPrintChanges) {
      yoga::log(
          node,
          LogLevel::Verbose,
          "%s%d.}%s",
          spacerWithLength(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print();
      yoga::log(
          node,
          LogLevel::Verbose,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          measureModeName(widthMeasureMode, performLayout),
          measureModeName(heightMeasureMode, performLayout),
          layout->measuredDimension(YGDimensionWidth),
          layout->measuredDimension(YGDimensionHeight),
          LayoutPassReasonToString(reason));
    }

    layout->lastOwnerDirection = ownerDirection;

    if (cachedResults == nullptr) {
      layoutMarkerData.maxMeasureCache = std::max(
          layoutMarkerData.maxMeasureCache,
          layout->nextCachedMeasurementsIndex + 1u);

      if (layout->nextCachedMeasurementsIndex ==
          LayoutResults::MaxCachedMeasurements) {
        if (gPrintChanges) {
          yoga::log(node, LogLevel::Verbose, "Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      CachedMeasurement* newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry =
            &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth =
          layout->measuredDimension(YGDimensionWidth);
      newCacheEntry->computedHeight =
          layout->measuredDimension(YGDimensionHeight);
    }
  }

  if (performLayout) {
    node->setLayoutDimension(
        node->getLayout().measuredDimension(YGDimensionWidth),
        YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimension(YGDimensionHeight),
        YGDimensionHeight);

    node->setHasNewLayout(true);
    node->setDirty(false);
  }

  layout->generationCount = generationCount;

  LayoutType layoutType;
  if (performLayout) {
    layoutType = !needToVisitNode && cachedResults == &layout->cachedLayout
        ? LayoutType::kCachedLayout
        : LayoutType::kLayout;
  } else {
    layoutType = cachedResults != nullptr ? LayoutType::kCachedMeasure
                                          : LayoutType::kMeasure;
  }
  Event::publish<Event::NodeLayout>(node, {layoutType});

  return (needToVisitNode || cachedResults == nullptr);
}

void calculateLayout(
    yoga::Node* const node,
    const float ownerWidth,
    const float ownerHeight,
    const Direction ownerDirection) {
  Event::publish<Event::LayoutPassStart>(node);
  LayoutData markerData = {};

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  gCurrentGenerationCount.fetch_add(1, std::memory_order_relaxed);
  node->resolveDimension();
  float width = YGUndefined;
  MeasureMode widthMeasureMode = MeasureMode::Undefined;
  const auto& style = node->getStyle();
  if (styleDefinesDimension(node, FlexDirection::Row, ownerWidth)) {
    width = (yoga::resolveValue(
                 node->getResolvedDimension(dimension(FlexDirection::Row)),
                 ownerWidth) +
             node->getMarginForAxis(FlexDirection::Row, ownerWidth))
                .unwrap();
    widthMeasureMode = MeasureMode::Exactly;
  } else if (!yoga::resolveValue(
                  style.maxDimension(YGDimensionWidth), ownerWidth)
                  .isUndefined()) {
    width = yoga::resolveValue(style.maxDimension(YGDimensionWidth), ownerWidth)
                .unwrap();
    widthMeasureMode = MeasureMode::AtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = yoga::isUndefined(width) ? MeasureMode::Undefined
                                                : MeasureMode::Exactly;
  }

  float height = YGUndefined;
  MeasureMode heightMeasureMode = MeasureMode::Undefined;
  if (styleDefinesDimension(node, FlexDirection::Column, ownerHeight)) {
    height = (yoga::resolveValue(
                  node->getResolvedDimension(dimension(FlexDirection::Column)),
                  ownerHeight) +
              node->getMarginForAxis(FlexDirection::Column, ownerWidth))
                 .unwrap();
    heightMeasureMode = MeasureMode::Exactly;
  } else if (!yoga::resolveValue(
                  style.maxDimension(YGDimensionHeight), ownerHeight)
                  .isUndefined()) {
    height =
        yoga::resolveValue(style.maxDimension(YGDimensionHeight), ownerHeight)
            .unwrap();
    heightMeasureMode = MeasureMode::AtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = yoga::isUndefined(height) ? MeasureMode::Undefined
                                                  : MeasureMode::Exactly;
  }
  if (calculateLayoutInternal(
          node,
          width,
          height,
          ownerDirection,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight,
          true,
          LayoutPassReason::kInitial,
          markerData,
          0, // tree root
          gCurrentGenerationCount.load(std::memory_order_relaxed))) {
    node->setPosition(
        node->getLayout().direction(), ownerWidth, ownerHeight, ownerWidth);
    roundLayoutResultsToPixelGrid(node, 0.0f, 0.0f);

#ifdef DEBUG
    if (node->getConfig()->shouldPrintTree()) {
      yoga::print(
          node,
          PrintOptions::Layout | PrintOptions::Children | PrintOptions::Style);
    }
#endif
  }

  Event::publish<Event::LayoutPassEnd>(node, {&markerData});
}

} // namespace facebook::yoga
