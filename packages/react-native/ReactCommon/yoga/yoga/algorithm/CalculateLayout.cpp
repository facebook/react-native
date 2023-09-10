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
#include <yoga/algorithm/Cache.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/CollectFlexItemsRowValues.h>
#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/PixelGrid.h>
#include <yoga/algorithm/ResolveValue.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/debug/Log.h>
#include <yoga/event/event.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

std::atomic<uint32_t> gCurrentGenerationCount(0);

bool calculateLayoutInternal(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const YGDirection ownerDirection,
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount);

static const std::array<YGEdge, 4> pos = {{
    YGEdgeTop,
    YGEdgeBottom,
    YGEdgeLeft,
    YGEdgeRight,
}};

static const std::array<YGDimension, 4> dim = {
    {YGDimensionHeight, YGDimensionHeight, YGDimensionWidth, YGDimensionWidth}};

static inline float paddingAndBorderForAxis(
    const yoga::Node* const node,
    const YGFlexDirection axis,
    const float widthSize) {
  return (node->getLeadingPaddingAndBorder(axis, widthSize) +
          node->getTrailingPaddingAndBorder(axis, widthSize))
      .unwrap();
}

static bool isBaselineLayout(const yoga::Node* node) {
  if (isColumn(node->getStyle().flexDirection())) {
    return false;
  }
  if (node->getStyle().alignItems() == YGAlignBaseline) {
    return true;
  }
  const auto childCount = node->getChildCount();
  for (size_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    if (child->getStyle().positionType() != YGPositionTypeAbsolute &&
        child->getStyle().alignSelf() == YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float dimensionWithMargin(
    const yoga::Node* const node,
    const YGFlexDirection axis,
    const float widthSize) {
  return node->getLayout().measuredDimensions[dim[axis]] +
      (node->getLeadingMargin(axis, widthSize) +
       node->getTrailingMargin(axis, widthSize))
          .unwrap();
}

static inline bool styleDefinesDimension(
    const yoga::Node* const node,
    const YGFlexDirection axis,
    const float ownerSize) {
  bool isUndefined =
      yoga::isUndefined(node->getResolvedDimension(dim[axis]).value);
  return !(
      node->getResolvedDimension(dim[axis]).unit == YGUnitAuto ||
      node->getResolvedDimension(dim[axis]).unit == YGUnitUndefined ||
      (node->getResolvedDimension(dim[axis]).unit == YGUnitPoint &&
       !isUndefined && node->getResolvedDimension(dim[axis]).value < 0.0f) ||
      (node->getResolvedDimension(dim[axis]).unit == YGUnitPercent &&
       !isUndefined &&
       (node->getResolvedDimension(dim[axis]).value < 0.0f ||
        yoga::isUndefined(ownerSize))));
}

static inline bool isLayoutDimensionDefined(
    const yoga::Node* const node,
    const YGFlexDirection axis) {
  const float value = node->getLayout().measuredDimensions[dim[axis]];
  return !yoga::isUndefined(value) && value >= 0.0f;
}

static FloatOptional boundAxisWithinMinAndMax(
    const yoga::Node* const node,
    const YGFlexDirection axis,
    const FloatOptional value,
    const float axisSize) {
  FloatOptional min;
  FloatOptional max;

  if (isColumn(axis)) {
    min = yoga::resolveValue(
        node->getStyle().minDimensions()[YGDimensionHeight], axisSize);
    max = yoga::resolveValue(
        node->getStyle().maxDimensions()[YGDimensionHeight], axisSize);
  } else if (isRow(axis)) {
    min = yoga::resolveValue(
        node->getStyle().minDimensions()[YGDimensionWidth], axisSize);
    max = yoga::resolveValue(
        node->getStyle().maxDimensions()[YGDimensionWidth], axisSize);
  }

  if (max >= FloatOptional{0} && value > max) {
    return max;
  }

  if (min >= FloatOptional{0} && value < min) {
    return min;
  }

  return value;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
static inline float boundAxis(
    const yoga::Node* const node,
    const YGFlexDirection axis,
    const float value,
    const float axisSize,
    const float widthSize) {
  return yoga::maxOrDefined(
      boundAxisWithinMinAndMax(node, axis, FloatOptional{value}, axisSize)
          .unwrap(),
      paddingAndBorderForAxis(node, axis, widthSize));
}

static void setChildTrailingPosition(
    const yoga::Node* const node,
    yoga::Node* const child,
    const YGFlexDirection axis) {
  const float size = child->getLayout().measuredDimensions[dim[axis]];
  child->setLayoutPosition(
      node->getLayout().measuredDimensions[dim[axis]] - size -
          child->getLayout().position[pos[axis]],
      trailingEdge(axis));
}

static void constrainMaxSizeForMode(
    const yoga::Node* const node,
    const enum YGFlexDirection axis,
    const float ownerAxisSize,
    const float ownerWidth,
    YGMeasureMode* mode,
    float* size) {
  const FloatOptional maxSize =
      yoga::resolveValue(
          node->getStyle().maxDimensions()[dim[axis]], ownerAxisSize) +
      FloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case YGMeasureModeExactly:
    case YGMeasureModeAtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.unwrap())
          ? *size
          : maxSize.unwrap();
      break;
    case YGMeasureModeUndefined:
      if (!maxSize.isUndefined()) {
        *mode = YGMeasureModeAtMost;
        *size = maxSize.unwrap();
      }
      break;
  }
}

static void computeFlexBasisForChild(
    const yoga::Node* const node,
    yoga::Node* const child,
    const float width,
    const YGMeasureMode widthMode,
    const float height,
    const float ownerWidth,
    const float ownerHeight,
    const YGMeasureMode heightMode,
    const YGDirection direction,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const YGFlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const bool isMainAxisRow = isRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  YGMeasureMode childWidthMeasureMode;
  YGMeasureMode childHeightMeasureMode;

  const FloatOptional resolvedFlexBasis =
      yoga::resolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined =
      styleDefinesDimension(child, YGFlexDirectionRow, ownerWidth);
  const bool isColumnStyleDimDefined =
      styleDefinesDimension(child, YGFlexDirectionColumn, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !yoga::isUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (child->getConfig()->isExperimentalFeatureEnabled(
             YGExperimentalFeatureWebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration != generationCount)) {
      const FloatOptional paddingAndBorder =
          FloatOptional(paddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          yoga::maxOrDefined(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const FloatOptional paddingAndBorder = FloatOptional(
        paddingAndBorderForAxis(child, YGFlexDirectionRow, ownerWidth));

    child->setLayoutComputedFlexBasis(yoga::maxOrDefined(
        yoga::resolveValue(
            child->getResolvedDimensions()[YGDimensionWidth], ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const FloatOptional paddingAndBorder = FloatOptional(
        paddingAndBorderForAxis(child, YGFlexDirectionColumn, ownerWidth));
    child->setLayoutComputedFlexBasis(yoga::maxOrDefined(
        yoga::resolveValue(
            child->getResolvedDimensions()[YGDimensionHeight], ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidth = YGUndefined;
    childHeight = YGUndefined;
    childWidthMeasureMode = YGMeasureModeUndefined;
    childHeightMeasureMode = YGMeasureModeUndefined;

    auto marginRow =
        child->getMarginForAxis(YGFlexDirectionRow, ownerWidth).unwrap();
    auto marginColumn =
        child->getMarginForAxis(YGFlexDirectionColumn, ownerWidth).unwrap();

    if (isRowStyleDimDefined) {
      childWidth =
          yoga::resolveValue(
              child->getResolvedDimensions()[YGDimensionWidth], ownerWidth)
              .unwrap() +
          marginRow;
      childWidthMeasureMode = YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          yoga::resolveValue(
              child->getResolvedDimensions()[YGDimensionHeight], ownerHeight)
              .unwrap() +
          marginColumn;
      childHeightMeasureMode = YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property, but all
    // major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow() == YGOverflowScroll) ||
        node->getStyle().overflow() != YGOverflowScroll) {
      if (yoga::isUndefined(childWidth) && !yoga::isUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow() == YGOverflowScroll) ||
        node->getStyle().overflow() != YGOverflowScroll) {
      if (yoga::isUndefined(childHeight) && !yoga::isUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = YGMeasureModeAtMost;
      }
    }

    const auto& childStyle = child->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == YGMeasureModeExactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = YGMeasureModeExactly;
      } else if (
          isMainAxisRow && childHeightMeasureMode == YGMeasureModeExactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = YGMeasureModeExactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch, set
    // the cross axis to be measured exactly with the available inner width

    const bool hasExactWidth =
        !yoga::isUndefined(width) && widthMode == YGMeasureModeExactly;
    const bool childWidthStretch =
        resolveChildAlignment(node, child) == YGAlignStretch &&
        childWidthMeasureMode != YGMeasureModeExactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth &&
        childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeExactly;
      if (!childStyle.aspectRatio().isUndefined()) {
        childHeight =
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight =
        !yoga::isUndefined(height) && heightMode == YGMeasureModeExactly;
    const bool childHeightStretch =
        resolveChildAlignment(node, child) == YGAlignStretch &&
        childHeightMeasureMode != YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight &&
        childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = YGMeasureModeExactly;

      if (!childStyle.aspectRatio().isUndefined()) {
        childWidth =
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = YGMeasureModeExactly;
      }
    }

    constrainMaxSizeForMode(
        child,
        YGFlexDirectionRow,
        ownerWidth,
        ownerWidth,
        &childWidthMeasureMode,
        &childWidth);
    constrainMaxSizeForMode(
        child,
        YGFlexDirectionColumn,
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
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);

    child->setLayoutComputedFlexBasis(FloatOptional(yoga::maxOrDefined(
        child->getLayout().measuredDimensions[dim[mainAxis]],
        paddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(generationCount);
}

static void layoutAbsoluteChild(
    const yoga::Node* const node,
    yoga::Node* const child,
    const float width,
    const YGMeasureMode widthMode,
    const float height,
    const YGDirection direction,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const YGFlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const YGFlexDirection crossAxis = resolveCrossDirection(mainAxis, direction);
  const bool isMainAxisRow = isRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  YGMeasureMode childWidthMeasureMode = YGMeasureModeUndefined;
  YGMeasureMode childHeightMeasureMode = YGMeasureModeUndefined;

  auto marginRow = child->getMarginForAxis(YGFlexDirectionRow, width).unwrap();
  auto marginColumn =
      child->getMarginForAxis(YGFlexDirectionColumn, width).unwrap();

  if (styleDefinesDimension(child, YGFlexDirectionRow, width)) {
    childWidth = yoga::resolveValue(
                     child->getResolvedDimensions()[YGDimensionWidth], width)
                     .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->isLeadingPositionDefined(YGFlexDirectionRow) &&
        child->isTrailingPosDefined(YGFlexDirectionRow)) {
      childWidth = node->getLayout().measuredDimensions[YGDimensionWidth] -
          (node->getLeadingBorder(YGFlexDirectionRow) +
           node->getTrailingBorder(YGFlexDirectionRow)) -
          (child->getLeadingPosition(YGFlexDirectionRow, width) +
           child->getTrailingPosition(YGFlexDirectionRow, width))
              .unwrap();
      childWidth =
          boundAxis(child, YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (styleDefinesDimension(child, YGFlexDirectionColumn, height)) {
    childHeight = yoga::resolveValue(
                      child->getResolvedDimensions()[YGDimensionHeight], height)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based on
    // the top/bottom offsets if they're defined.
    if (child->isLeadingPositionDefined(YGFlexDirectionColumn) &&
        child->isTrailingPosDefined(YGFlexDirectionColumn)) {
      childHeight = node->getLayout().measuredDimensions[YGDimensionHeight] -
          (node->getLeadingBorder(YGFlexDirectionColumn) +
           node->getTrailingBorder(YGFlexDirectionColumn)) -
          (child->getLeadingPosition(YGFlexDirectionColumn, height) +
           child->getTrailingPosition(YGFlexDirectionColumn, height))
              .unwrap();
      childHeight =
          boundAxis(child, YGFlexDirectionColumn, childHeight, height, width);
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
        ? YGMeasureModeUndefined
        : YGMeasureModeExactly;
    childHeightMeasureMode = yoga::isUndefined(childHeight)
        ? YGMeasureModeUndefined
        : YGMeasureModeExactly;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && yoga::isUndefined(childWidth) &&
        widthMode != YGMeasureModeUndefined && !yoga::isUndefined(width) &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = YGMeasureModeAtMost;
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
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);
    childWidth = child->getLayout().measuredDimensions[YGDimensionWidth] +
        child->getMarginForAxis(YGFlexDirectionRow, width).unwrap();
    childHeight = child->getLayout().measuredDimensions[YGDimensionHeight] +
        child->getMarginForAxis(YGFlexDirectionColumn, width).unwrap();
  }

  calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      YGMeasureModeExactly,
      YGMeasureModeExactly,
      childWidth,
      childHeight,
      true,
      LayoutPassReason::kAbsLayout,
      config,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[mainAxis]] -
            child->getLayout().measuredDimensions[dim[mainAxis]] -
            node->getTrailingBorder(mainAxis) -
            child->getTrailingMargin(mainAxis, isMainAxisRow ? width : height)
                .unwrap() -
            child->getTrailingPosition(mainAxis, isMainAxisRow ? width : height)
                .unwrap(),
        leadingEdge(mainAxis));
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == YGJustifyCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]) /
            2.0f,
        leadingEdge(mainAxis));
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == YGJustifyFlexEnd) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]),
        leadingEdge(mainAxis));
  } else if (
      node->getConfig()->isExperimentalFeatureEnabled(
          YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 mainAxis, node->getLayout().measuredDimensions[dim[mainAxis]])
                .unwrap() +
            node->getLeadingBorder(mainAxis) +
            child
                ->getLeadingMargin(
                    mainAxis,
                    node->getLayout().measuredDimensions[dim[mainAxis]])
                .unwrap(),
        leadingEdge(mainAxis));
  }

  if (child->isTrailingPosDefined(crossAxis) &&
      !child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[crossAxis]] -
            child->getLayout().measuredDimensions[dim[crossAxis]] -
            node->getTrailingBorder(crossAxis) -
            child->getTrailingMargin(crossAxis, isMainAxisRow ? height : width)
                .unwrap() -
            child
                ->getTrailingPosition(crossAxis, isMainAxisRow ? height : width)
                .unwrap(),
        leadingEdge(crossAxis));

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      resolveChildAlignment(node, child) == YGAlignCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]) /
            2.0f,
        leadingEdge(crossAxis));
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((resolveChildAlignment(node, child) == YGAlignFlexEnd) ^
       (node->getStyle().flexWrap() == YGWrapWrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]),
        leadingEdge(crossAxis));
  } else if (
      node->getConfig()->isExperimentalFeatureEnabled(
          YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 crossAxis,
                 node->getLayout().measuredDimensions[dim[crossAxis]])
                .unwrap() +
            node->getLeadingBorder(crossAxis) +
            child
                ->getLeadingMargin(
                    crossAxis,
                    node->getLayout().measuredDimensions[dim[crossAxis]])
                .unwrap(),
        leadingEdge(crossAxis));
  }
}

static void measureNodeWithMeasureFunc(
    yoga::Node* const node,
    float availableWidth,
    float availableHeight,
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const LayoutPassReason reason) {
  yoga::assertFatalWithNode(
      node,
      node->hasMeasureFunc(),
      "Expected node to have custom measure function");

  if (widthMeasureMode == YGMeasureModeUndefined) {
    availableWidth = YGUndefined;
  }
  if (heightMeasureMode == YGMeasureModeUndefined) {
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

  if (widthMeasureMode == YGMeasureModeExactly &&
      heightMeasureMode == YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node, YGFlexDirectionRow, availableWidth, ownerWidth, ownerWidth),
        YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            YGFlexDirectionColumn,
            availableHeight,
            ownerHeight,
            ownerWidth),
        YGDimensionHeight);
  } else {
    Event::publish<Event::MeasureCallbackStart>(node);

    // Measure the text under the current constraints.
    const YGSize measuredSize = node->measure(
        innerWidth,
        widthMeasureMode,
        innerHeight,
        heightMeasureMode,
        layoutContext);

    layoutMarkerData.measureCallbacks += 1;
    layoutMarkerData.measureCallbackReasonsCount[static_cast<size_t>(reason)] +=
        1;

    Event::publish<Event::MeasureCallbackEnd>(
        node,
        {layoutContext,
         innerWidth,
         widthMeasureMode,
         innerHeight,
         heightMeasureMode,
         measuredSize.width,
         measuredSize.height,
         reason});

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            YGFlexDirectionRow,
            (widthMeasureMode == YGMeasureModeUndefined ||
             widthMeasureMode == YGMeasureModeAtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            YGFlexDirectionColumn,
            (heightMeasureMode == YGMeasureModeUndefined ||
             heightMeasureMode == YGMeasureModeAtMost)
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
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  const auto& padding = node->getLayout().padding;
  const auto& border = node->getLayout().border;

  float width = availableWidth;
  if (widthMeasureMode == YGMeasureModeUndefined ||
      widthMeasureMode == YGMeasureModeAtMost) {
    width = padding[YGEdgeLeft] + padding[YGEdgeRight] + border[YGEdgeLeft] +
        border[YGEdgeRight];
  }
  node->setLayoutMeasuredDimension(
      boundAxis(node, YGFlexDirectionRow, width, ownerWidth, ownerWidth),
      YGDimensionWidth);

  float height = availableHeight;
  if (heightMeasureMode == YGMeasureModeUndefined ||
      heightMeasureMode == YGMeasureModeAtMost) {
    height = padding[YGEdgeTop] + padding[YGEdgeBottom] + border[YGEdgeTop] +
        border[YGEdgeBottom];
  }
  node->setLayoutMeasuredDimension(
      boundAxis(node, YGFlexDirectionColumn, height, ownerHeight, ownerWidth),
      YGDimensionHeight);
}

static bool measureNodeWithFixedSize(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  if ((!yoga::isUndefined(availableWidth) &&
       widthMeasureMode == YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (!yoga::isUndefined(availableHeight) &&
       heightMeasureMode == YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == YGMeasureModeExactly &&
       heightMeasureMode == YGMeasureModeExactly)) {
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            YGFlexDirectionRow,
            yoga::isUndefined(availableWidth) ||
                    (widthMeasureMode == YGMeasureModeAtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth,
            ownerWidth,
            ownerWidth),
        YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            YGFlexDirectionColumn,
            yoga::isUndefined(availableHeight) ||
                    (heightMeasureMode == YGMeasureModeAtMost &&
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

static void zeroOutLayoutRecursively(
    yoga::Node* const node,
    void* layoutContext) {
  node->getLayout() = {};
  node->setLayoutDimension(0, YGDimensionWidth);
  node->setLayoutDimension(0, YGDimensionHeight);
  node->setHasNewLayout(true);

  node->iterChildrenAfterCloningIfNeeded(
      zeroOutLayoutRecursively, layoutContext);
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
    const FloatOptional minDimensionOptional = yoga::resolveValue(
        node->getStyle().minDimensions()[dimension], ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.unwrap() - paddingAndBorder;

    const FloatOptional maxDimensionOptional = yoga::resolveValue(
        node->getStyle().maxDimensions()[dimension], ownerDim);

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
    YGMeasureMode widthMeasureMode,
    YGMeasureMode heightMeasureMode,
    YGDirection direction,
    YGFlexDirection mainAxis,
    const yoga::Config* const config,
    bool performLayout,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float totalOuterFlexBasis = 0.0f;
  YGNodeRef singleFlexChild = nullptr;
  const auto& children = node->getChildren();
  YGMeasureMode measureModeMainDim =
      isRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == YGMeasureModeExactly) {
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
    if (child->getStyle().display() == YGDisplayNone) {
      zeroOutLayoutRecursively(child, layoutContext);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const YGDirection childDirection = child->resolveDirection(direction);
      const float mainDim =
          isRow(mainAxis) ? availableInnerWidth : availableInnerHeight;
      const float crossDim =
          isRow(mainAxis) ? availableInnerHeight : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType() == YGPositionTypeAbsolute) {
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
          config,
          layoutMarkerData,
          layoutContext,
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

// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// computeFlexBasisForChildren function). This function calculates
// YGCollectFlexItemsRowMeasurement
static CollectFlexItemsRowValues calculateCollectFlexItemsRowValues(
    yoga::Node* const node,
    const YGDirection ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const uint32_t startOfLineIndex,
    const uint32_t lineCount) {
  CollectFlexItemsRowValues flexAlgoRowMeasurement = {};
  flexAlgoRowMeasurement.relativeChildren.reserve(node->getChildren().size());

  float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;
  const YGFlexDirection mainAxis = resolveDirection(
      node->getStyle().flexDirection(), node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != YGWrapNoWrap;
  const float gap = node->getGapForAxis(mainAxis, availableInnerWidth).unwrap();

  // Add items to the current line until it's full or we run out of items.
  uint32_t endOfLineIndex = startOfLineIndex;
  for (; endOfLineIndex < node->getChildren().size(); endOfLineIndex++) {
    auto child = node->getChild(endOfLineIndex);
    if (child->getStyle().display() == YGDisplayNone ||
        child->getStyle().positionType() == YGPositionTypeAbsolute) {
      continue;
    }

    const bool isFirstElementInLine = (endOfLineIndex - startOfLineIndex) == 0;

    child->setLineIndex(lineCount);
    const float childMarginMainAxis =
        child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap();
    const float childLeadingGapMainAxis = isFirstElementInLine ? 0.0f : gap;
    const float flexBasisWithMinAndMaxConstraints =
        boundAxisWithinMinAndMax(
            child,
            mainAxis,
            child->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    if (sizeConsumedOnCurrentLineIncludingMinConstraint +
                flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
                childLeadingGapMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && flexAlgoRowMeasurement.itemsOnLine > 0) {
      break;
    }

    sizeConsumedOnCurrentLineIncludingMinConstraint +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;
    flexAlgoRowMeasurement.sizeConsumedOnCurrentLine +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;
    flexAlgoRowMeasurement.itemsOnLine++;

    if (child->isNodeFlexible()) {
      flexAlgoRowMeasurement.totalFlexGrowFactors += child->resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors +=
          -child->resolveFlexShrink() *
          child->getLayout().computedFlexBasis.unwrap();
    }

    flexAlgoRowMeasurement.relativeChildren.push_back(child);
  }

  // The total flex factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexGrowFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexGrowFactors < 1) {
    flexAlgoRowMeasurement.totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexShrinkScaledFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors < 1) {
    flexAlgoRowMeasurement.totalFlexShrinkScaledFactors = 1;
  }
  flexAlgoRowMeasurement.endOfLineIndex = endOfLineIndex;
  return flexAlgoRowMeasurement;
}

// It distributes the free space to the flexible items and ensures that the size
// of the flex items abide the min and max constraints. At the end of this
// function the child nodes would have proper size. Prior using this function
// please ensure that distributeFreeSpaceFirstPass is called.
static float distributeFreeSpaceSecondPass(
    CollectFlexItemsRowValues& collectedFlexItemsValues,
    yoga::Node* const node,
    const YGFlexDirection mainAxis,
    const YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = isRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != YGWrapNoWrap;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    childFlexBasis = boundAxisWithinMinAndMax(
                         currentRelativeChild,
                         mainAxis,
                         currentRelativeChild->getLayout().computedFlexBasis,
                         mainAxisownerSize)
                         .unwrap();
    float updatedMainSize = childFlexBasis;

    if (!yoga::isUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!yoga::isUndefined(
                collectedFlexItemsValues.totalFlexShrinkScaledFactors) &&
            collectedFlexItemsValues.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (collectedFlexItemsValues.remainingFreeSpace /
               collectedFlexItemsValues.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = boundAxis(
            currentRelativeChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !yoga::isUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!std::isnan(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = boundAxis(
            currentRelativeChild,
            mainAxis,
            childFlexBasis +
                collectedFlexItemsValues.remainingFreeSpace /
                    collectedFlexItemsValues.totalFlexGrowFactors *
                    flexGrowFactor,
            availableInnerMainDim,
            availableInnerWidth);
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const float marginMain =
        currentRelativeChild->getMarginForAxis(mainAxis, availableInnerWidth)
            .unwrap();
    const float marginCross =
        currentRelativeChild->getMarginForAxis(crossAxis, availableInnerWidth)
            .unwrap();

    float childCrossSize;
    float childMainSize = updatedMainSize + marginMain;
    YGMeasureMode childCrossMeasureMode;
    YGMeasureMode childMainMeasureMode = YGMeasureModeExactly;

    const auto& childStyle = currentRelativeChild->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      childCrossSize = isMainAxisRow
          ? (childMainSize - marginMain) / childStyle.aspectRatio().unwrap()
          : (childMainSize - marginMain) * childStyle.aspectRatio().unwrap();
      childCrossMeasureMode = YGMeasureModeExactly;

      childCrossSize += marginCross;
    } else if (
        !std::isnan(availableInnerCrossDim) &&
        !styleDefinesDimension(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == YGMeasureModeExactly &&
        !(isNodeFlexWrap && mainAxisOverflows) &&
        resolveChildAlignment(node, currentRelativeChild) == YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit !=
            YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = YGMeasureModeExactly;
    } else if (!styleDefinesDimension(
                   currentRelativeChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = yoga::isUndefined(childCrossSize)
          ? YGMeasureModeUndefined
          : YGMeasureModeAtMost;
    } else {
      childCrossSize =
          yoga::resolveValue(
              currentRelativeChild->getResolvedDimension(dim[crossAxis]),
              availableInnerCrossDim)
              .unwrap() +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentRelativeChild->getResolvedDimension(dim[crossAxis]).unit ==
              YGUnitPercent &&
          measureModeCrossDim != YGMeasureModeExactly;
      childCrossMeasureMode =
          yoga::isUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? YGMeasureModeUndefined
          : YGMeasureModeExactly;
    }

    constrainMaxSizeForMode(
        currentRelativeChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    constrainMaxSizeForMode(
        currentRelativeChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !styleDefinesDimension(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        resolveChildAlignment(node, currentRelativeChild) == YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit != YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const YGMeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const YGMeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    const bool isLayoutPass = performLayout && !requiresStretchLayout;
    // Recursively call the layout algorithm for this child with the updated
    // main size.
    calculateLayoutInternal(
        currentRelativeChild,
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
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);
    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() ||
        currentRelativeChild->getLayout().hadOverflow());
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void distributeFreeSpaceFirstPass(
    CollectFlexItemsRowValues& collectedFlexItemsValues,
    const YGFlexDirection mainAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerWidth) {
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float baseMainSize = 0;
  float boundMainSize = 0;
  float deltaFreeSpace = 0;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    float childFlexBasis =
        boundAxisWithinMinAndMax(
            currentRelativeChild,
            mainAxis,
            currentRelativeChild->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    if (collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!yoga::isUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = boundAxis(
            currentRelativeChild,
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
          collectedFlexItemsValues.totalFlexShrinkScaledFactors -=
              (-currentRelativeChild->resolveFlexShrink() *
               currentRelativeChild->getLayout().computedFlexBasis.unwrap());
        }
      }
    } else if (
        !yoga::isUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!yoga::isUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = boundAxis(
            currentRelativeChild,
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
          collectedFlexItemsValues.totalFlexGrowFactors -= flexGrowFactor;
        }
      }
    }
  }
  collectedFlexItemsValues.remainingFreeSpace -= deltaFreeSpace;
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
    CollectFlexItemsRowValues& collectedFlexItemsValues,
    const YGFlexDirection mainAxis,
    const YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const float originalFreeSpace = collectedFlexItemsValues.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  distributeFreeSpaceFirstPass(
      collectedFlexItemsValues,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = distributeFreeSpaceSecondPass(
      collectedFlexItemsValues,
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
      config,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  collectedFlexItemsValues.remainingFreeSpace =
      originalFreeSpace - distributedFreeSpace;
}

static void YGJustifyMainAxis(
    yoga::Node* const node,
    CollectFlexItemsRowValues& collectedFlexItemsValues,
    const uint32_t startOfLineIndex,
    const YGFlexDirection mainAxis,
    const YGFlexDirection crossAxis,
    const YGMeasureMode measureModeMainDim,
    const YGMeasureMode measureModeCrossDim,
    const float mainAxisownerSize,
    const float ownerWidth,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const bool performLayout,
    void* const layoutContext) {
  const auto& style = node->getStyle();
  const float leadingPaddingAndBorderMain =
      node->getLeadingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  const float trailingPaddingAndBorderMain =
      node->getTrailingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  const float gap = node->getGapForAxis(mainAxis, ownerWidth).unwrap();
  // If we are using "at most" rules in the main axis, make sure that
  // remainingFreeSpace is 0 when min main dimension is not given
  if (measureModeMainDim == YGMeasureModeAtMost &&
      collectedFlexItemsValues.remainingFreeSpace > 0) {
    if (!style.minDimensions()[dim[mainAxis]].isUndefined() &&
        !yoga::resolveValue(
             style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
             .isUndefined()) {
      // This condition makes sure that if the size of main dimension(after
      // considering child nodes main dim, leading and trailing padding etc)
      // falls below min dimension, then the remainingFreeSpace is reassigned
      // considering the min dimension

      // `minAvailableMainDim` denotes minimum available space in which child
      // can be laid out, it will exclude space consumed by padding and border.
      const float minAvailableMainDim =
          yoga::resolveValue(
              style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
              .unwrap() -
          leadingPaddingAndBorderMain - trailingPaddingAndBorderMain;
      const float occupiedSpaceByChildNodes =
          availableInnerMainDim - collectedFlexItemsValues.remainingFreeSpace;
      collectedFlexItemsValues.remainingFreeSpace = yoga::maxOrDefined(
          0, minAvailableMainDim - occupiedSpaceByChildNodes);
    } else {
      collectedFlexItemsValues.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    auto child = node->getChild(i);
    if (child->getStyle().positionType() != YGPositionTypeAbsolute) {
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
  const YGJustify justifyContent = node->getStyle().justifyContent();

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case YGJustifyCenter:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace / 2;
        break;
      case YGJustifyFlexEnd:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace;
        break;
      case YGJustifySpaceBetween:
        if (collectedFlexItemsValues.itemsOnLine > 1) {
          betweenMainDim +=
              yoga::maxOrDefined(
                  collectedFlexItemsValues.remainingFreeSpace, 0) /
              static_cast<float>(collectedFlexItemsValues.itemsOnLine - 1);
        }
        break;
      case YGJustifySpaceEvenly:
        // Space is distributed evenly across all elements
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace /
            static_cast<float>(collectedFlexItemsValues.itemsOnLine + 1);
        betweenMainDim += leadingMainDim;
        break;
      case YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        leadingMainDim = 0.5f * collectedFlexItemsValues.remainingFreeSpace /
            static_cast<float>(collectedFlexItemsValues.itemsOnLine);
        betweenMainDim += leadingMainDim * 2;
        break;
      case YGJustifyFlexStart:
        break;
    }
  }

  collectedFlexItemsValues.mainDim =
      leadingPaddingAndBorderMain + leadingMainDim;
  collectedFlexItemsValues.crossDim = 0;

  float maxAscentForCurrentLine = 0;
  float maxDescentForCurrentLine = 0;
  bool isNodeBaselineLayout = isBaselineLayout(node);
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const auto child = node->getChild(i);
    const Style& childStyle = child->getStyle();
    const LayoutResults& childLayout = child->getLayout();
    const bool isLastChild = i == collectedFlexItemsValues.endOfLineIndex - 1;
    // remove the gap if it is the last element of the line
    if (isLastChild) {
      betweenMainDim -= gap;
    }
    if (childStyle.display() == YGDisplayNone) {
      continue;
    }
    if (childStyle.positionType() == YGPositionTypeAbsolute &&
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
            pos[mainAxis]);
      }
    } else {
      // Now that we placed the element, we need to update the variables.
      // We need to do that only for relative elements. Absolute elements do not
      // take part in that phase.
      if (childStyle.positionType() != YGPositionTypeAbsolute) {
        if (child->marginLeadingValue(mainAxis).unit == YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              static_cast<float>(numberOfAutoMarginsOnCurrentLine);
        }

        if (performLayout) {
          child->setLayoutPosition(
              childLayout.position[pos[mainAxis]] +
                  collectedFlexItemsValues.mainDim,
              pos[mainAxis]);
        }

        if (child->marginTrailingValue(mainAxis).unit == YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              static_cast<float>(numberOfAutoMarginsOnCurrentLine);
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == YGMeasureModeExactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the measuredDims
          // because they weren't computed. This means we can't call
          // dimensionWithMargin.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap() +
              childLayout.computedFlexBasis.unwrap();
          collectedFlexItemsValues.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              dimensionWithMargin(child, mainAxis, availableInnerWidth);

          if (isNodeBaselineLayout) {
            // If the child is baseline aligned then the cross dimension is
            // calculated by adding maxAscent and maxDescent from the baseline.
            const float ascent = calculateBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        YGFlexDirectionColumn, availableInnerWidth)
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
            collectedFlexItemsValues.crossDim = yoga::maxOrDefined(
                collectedFlexItemsValues.crossDim,
                dimensionWithMargin(child, crossAxis, availableInnerWidth));
          }
        }
      } else if (performLayout) {
        child->setLayoutPosition(
            childLayout.position[pos[mainAxis]] +
                node->getLeadingBorder(mainAxis) + leadingMainDim,
            pos[mainAxis]);
      }
    }
  }
  collectedFlexItemsValues.mainDim += trailingPaddingAndBorderMain;

  if (isNodeBaselineLayout) {
    collectedFlexItemsValues.crossDim =
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
//      - YGMeasureModeUndefined: max content
//      - YGMeasureModeExactly: fill available
//      - YGMeasureModeAtMost: fit content
//
//    When calling calculateLayoutImpl and calculateLayoutInternal, if the
//    caller passes an available size of undefined then it must also pass a
//    measure mode of YGMeasureModeUndefined in that dimension.
//
static void calculateLayoutImpl(
    yoga::Node* const node,
    const float availableWidth,
    const float availableHeight,
    const YGDirection ownerDirection,
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount,
    const LayoutPassReason reason) {
  yoga::assertFatalWithNode(
      node,
      yoga::isUndefined(availableWidth)
          ? widthMeasureMode == YGMeasureModeUndefined
          : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "YGMeasureModeUndefined");
  yoga::assertFatalWithNode(
      node,
      yoga::isUndefined(availableHeight)
          ? heightMeasureMode == YGMeasureModeUndefined
          : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "YGMeasureModeUndefined");

  (performLayout ? layoutMarkerData.layouts : layoutMarkerData.measures) += 1;

  // Set the resolved resolution in the node's layout.
  const YGDirection direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const YGFlexDirection flexRowDirection =
      resolveDirection(YGFlexDirectionRow, direction);
  const YGFlexDirection flexColumnDirection =
      resolveDirection(YGFlexDirectionColumn, direction);

  const YGEdge startEdge =
      direction == YGDirectionLTR ? YGEdgeLeft : YGEdgeRight;
  const YGEdge endEdge = direction == YGDirectionLTR ? YGEdgeRight : YGEdgeLeft;

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
        layoutContext,
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
  node->cloneChildrenIfNeeded(layoutContext);
  // Reset layout flags, as they could have changed.
  node->setLayoutHadOverflow(false);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const YGFlexDirection mainAxis =
      resolveDirection(node->getStyle().flexDirection(), direction);
  const YGFlexDirection crossAxis = resolveCrossDirection(mainAxis, direction);
  const bool isMainAxisRow = isRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != YGWrapNoWrap;

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

  YGMeasureMode measureModeMainDim =
      isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  YGMeasureMode measureModeCrossDim =
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
      config,
      performLayout,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  if (childCount > 1) {
    totalMainDim +=
        node->getGapForAxis(mainAxis, availableInnerCrossDim).unwrap() *
        static_cast<float>(childCount - 1);
  }

  const bool mainAxisOverflows =
      (measureModeMainDim != YGMeasureModeUndefined) &&
      totalMainDim > availableInnerMainDim;

  if (isNodeFlexWrap && mainAxisOverflows &&
      measureModeMainDim == YGMeasureModeAtMost) {
    measureModeMainDim = YGMeasureModeExactly;
  }
  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  const float crossAxisGap =
      node->getGapForAxis(crossAxis, availableInnerCrossDim).unwrap();

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;
  CollectFlexItemsRowValues collectedFlexItemsValues;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    collectedFlexItemsValues = calculateCollectFlexItemsRowValues(
        node,
        ownerDirection,
        mainAxisownerSize,
        availableInnerWidth,
        availableInnerMainDim,
        startOfLineIndex,
        lineCount);
    endOfLineIndex = collectedFlexItemsValues.endOfLineIndex;

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex =
        !performLayout && measureModeCrossDim == YGMeasureModeExactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated. If
    // the main dimension size isn't known, it is computed based on the line
    // length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (measureModeMainDim != YGMeasureModeExactly) {
      const auto& minDimensions = node->getStyle().minDimensions();
      const auto& maxDimensions = node->getStyle().maxDimensions();
      const float minInnerWidth =
          yoga::resolveValue(minDimensions[YGDimensionWidth], ownerWidth)
              .unwrap() -
          paddingAndBorderAxisRow;
      const float maxInnerWidth =
          yoga::resolveValue(maxDimensions[YGDimensionWidth], ownerWidth)
              .unwrap() -
          paddingAndBorderAxisRow;
      const float minInnerHeight =
          yoga::resolveValue(minDimensions[YGDimensionHeight], ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;
      const float maxInnerHeight =
          yoga::resolveValue(maxDimensions[YGDimensionHeight], ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;

      const float minInnerMainDim =
          isMainAxisRow ? minInnerWidth : minInnerHeight;
      const float maxInnerMainDim =
          isMainAxisRow ? maxInnerWidth : maxInnerHeight;

      if (!yoga::isUndefined(minInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine <
              minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !yoga::isUndefined(maxInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine >
              maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        bool useLegacyStretchBehaviour =
            node->hasErrata(YGErrataStretchFlexBasis);

        if (!useLegacyStretchBehaviour &&
            ((!yoga::isUndefined(
                  collectedFlexItemsValues.totalFlexGrowFactors) &&
              collectedFlexItemsValues.totalFlexGrowFactors == 0) ||
             (!yoga::isUndefined(node->resolveFlexGrow()) &&
              node->resolveFlexGrow() == 0))) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim =
              collectedFlexItemsValues.sizeConsumedOnCurrentLine;
        }

        sizeBasedOnContent = !useLegacyStretchBehaviour;
      }
    }

    if (!sizeBasedOnContent && !yoga::isUndefined(availableInnerMainDim)) {
      collectedFlexItemsValues.remainingFreeSpace = availableInnerMainDim -
          collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    } else if (collectedFlexItemsValues.sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its content. sizeConsumedOnCurrentLine is negative which means
      // the node will allocate 0 points for its content. Consequently,
      // remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      collectedFlexItemsValues.remainingFreeSpace =
          -collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    }

    if (!canSkipFlex) {
      resolveFlexibleLength(
          node,
          collectedFlexItemsValues,
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
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() |
        (collectedFlexItemsValues.remainingFreeSpace < 0));

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis. Their dimensions are also set in the cross axis with the exception
    // of items that are aligned "stretch". We need to compute these stretch
    // values and set the final positions.

    YGJustifyMainAxis(
        node,
        collectedFlexItemsValues,
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
        performLayout,
        layoutContext);

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == YGMeasureModeUndefined ||
        measureModeCrossDim == YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          boundAxis(
              node,
              crossAxis,
              collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == YGMeasureModeExactly) {
      collectedFlexItemsValues.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    collectedFlexItemsValues.crossDim =
        boundAxis(
            node,
            crossAxis,
            collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth) -
        paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const auto child = node->getChild(i);
        if (child->getStyle().display() == YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() == YGPositionTypeAbsolute) {
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
                pos[crossAxis]);
          }
          // If leading position is not defined or calculations result in Nan,
          // default to border + margin
          if (!isChildLeadingPosDefined ||
              yoga::isUndefined(child->getLayout().position[pos[crossAxis]])) {
            child->setLayoutPosition(
                node->getLeadingBorder(crossAxis) +
                    child->getLeadingMargin(crossAxis, availableInnerWidth)
                        .unwrap(),
                pos[crossAxis]);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (owner) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const YGAlign alignItem = resolveChildAlignment(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time forcing the cross-axis size to be the computed
          // cross size for the current line.
          if (alignItem == YGAlignStretch &&
              child->marginLeadingValue(crossAxis).unit != YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!styleDefinesDimension(
                    child, crossAxis, availableInnerCrossDim)) {
              float childMainSize =
                  child->getLayout().measuredDimensions[dim[mainAxis]];
              const auto& childStyle = child->getStyle();
              float childCrossSize = !childStyle.aspectRatio().isUndefined()
                  ? child->getMarginForAxis(crossAxis, availableInnerWidth)
                          .unwrap() +
                      (isMainAxisRow
                           ? childMainSize / childStyle.aspectRatio().unwrap()
                           : childMainSize * childStyle.aspectRatio().unwrap())
                  : collectedFlexItemsValues.crossDim;

              childMainSize +=
                  child->getMarginForAxis(mainAxis, availableInnerWidth)
                      .unwrap();

              YGMeasureMode childMainMeasureMode = YGMeasureModeExactly;
              YGMeasureMode childCrossMeasureMode = YGMeasureModeExactly;
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
                  alignContent != YGAlignStretch && isNodeFlexWrap;
              const YGMeasureMode childWidthMeasureMode =
                  yoga::isUndefined(childWidth) ||
                      (!isMainAxisRow && crossAxisDoesNotGrow)
                  ? YGMeasureModeUndefined
                  : YGMeasureModeExactly;
              const YGMeasureMode childHeightMeasureMode =
                  yoga::isUndefined(childHeight) ||
                      (isMainAxisRow && crossAxisDoesNotGrow)
                  ? YGMeasureModeUndefined
                  : YGMeasureModeExactly;

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
                  config,
                  layoutMarkerData,
                  layoutContext,
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
            } else if (alignItem == YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->setLayoutPosition(
              child->getLayout().position[pos[crossAxis]] + totalLineCrossDim +
                  leadingCrossDim,
              pos[crossAxis]);
        }
      }
    }

    const float appliedCrossGap = lineCount != 0 ? crossAxisGap : 0.0f;
    totalLineCrossDim += collectedFlexItemsValues.crossDim + appliedCrossGap;
    maxLineMainDim =
        yoga::maxOrDefined(maxLineMainDim, collectedFlexItemsValues.mainDim);
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
        case YGAlignFlexEnd:
          currentLead += remainingAlignContentDim;
          break;
        case YGAlignCenter:
          currentLead += remainingAlignContentDim / 2;
          break;
        case YGAlignStretch:
          if (availableInnerCrossDim > totalLineCrossDim) {
            crossDimLead =
                remainingAlignContentDim / static_cast<float>(lineCount);
          }
          break;
        case YGAlignSpaceAround:
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
        case YGAlignSpaceBetween:
          if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            crossDimLead =
                remainingAlignContentDim / static_cast<float>(lineCount - 1);
          }
          break;
        case YGAlignAuto:
        case YGAlignFlexStart:
        case YGAlignBaseline:
          break;
      }
    }
    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      const uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const auto child = node->getChild(ii);
        if (child->getStyle().display() == YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() != YGPositionTypeAbsolute) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (isLayoutDimensionDefined(child, crossAxis)) {
            lineHeight = yoga::maxOrDefined(
                lineHeight,
                child->getLayout().measuredDimensions[dim[crossAxis]] +
                    child->getMarginForAxis(crossAxis, availableInnerWidth)
                        .unwrap());
          }
          if (resolveChildAlignment(node, child) == YGAlignBaseline) {
            const float ascent = calculateBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        YGFlexDirectionColumn, availableInnerWidth)
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
          if (child->getStyle().display() == YGDisplayNone) {
            continue;
          }
          if (child->getStyle().positionType() != YGPositionTypeAbsolute) {
            switch (resolveChildAlignment(node, child)) {
              case YGAlignFlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);
                break;
              }
              case YGAlignFlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        child->getTrailingMargin(crossAxis, availableInnerWidth)
                            .unwrap() -
                        child->getLayout().measuredDimensions[dim[crossAxis]],
                    pos[crossAxis]);
                break;
              }
              case YGAlignCenter: {
                float childHeight =
                    child->getLayout().measuredDimensions[dim[crossAxis]];

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    pos[crossAxis]);
                break;
              }
              case YGAlignStretch: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);

                // Remeasure child with the line height as it as been only
                // measured with the owners height yet.
                if (!styleDefinesDimension(
                        child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[YGDimensionWidth] +
                         child->getMarginForAxis(mainAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[YGDimensionHeight] +
                         child->getMarginForAxis(crossAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  if (!(yoga::inexactEquals(
                            childWidth,
                            child->getLayout()
                                .measuredDimensions[YGDimensionWidth]) &&
                        yoga::inexactEquals(
                            childHeight,
                            child->getLayout()
                                .measuredDimensions[YGDimensionHeight]))) {
                    calculateLayoutInternal(
                        child,
                        childWidth,
                        childHeight,
                        direction,
                        YGMeasureModeExactly,
                        YGMeasureModeExactly,
                        availableInnerWidth,
                        availableInnerHeight,
                        true,
                        LayoutPassReason::kMultilineStretch,
                        config,
                        layoutMarkerData,
                        layoutContext,
                        depth,
                        generationCount);
                  }
                }
                break;
              }
              case YGAlignBaseline: {
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine -
                        calculateBaseline(child, layoutContext) +
                        child
                            ->getLeadingPosition(
                                YGFlexDirectionColumn, availableInnerCrossDim)
                            .unwrap(),
                    YGEdgeTop);

                break;
              }
              case YGAlignAuto:
              case YGAlignSpaceBetween:
              case YGAlignSpaceAround:
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
          YGFlexDirectionRow,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      boundAxis(
          node,
          YGFlexDirectionColumn,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == YGMeasureModeUndefined ||
      (node->getStyle().overflow() != YGOverflowScroll &&
       measureModeMainDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dim[mainAxis]);

  } else if (
      measureModeMainDim == YGMeasureModeAtMost &&
      node->getStyle().overflow() == YGOverflowScroll) {
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
        dim[mainAxis]);
  }

  if (measureModeCrossDim == YGMeasureModeUndefined ||
      (node->getStyle().overflow() != YGOverflowScroll &&
       measureModeCrossDim == YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        boundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dim[crossAxis]);

  } else if (
      measureModeCrossDim == YGMeasureModeAtMost &&
      node->getStyle().overflow() == YGOverflowScroll) {
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
        dim[crossAxis]);
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap() == YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const auto child = node->getChild(i);
      if (child->getStyle().positionType() != YGPositionTypeAbsolute) {
        child->setLayoutPosition(
            node->getLayout().measuredDimensions[dim[crossAxis]] -
                child->getLayout().position[pos[crossAxis]] -
                child->getLayout().measuredDimensions[dim[crossAxis]],
            pos[crossAxis]);
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (auto child : node->getChildren()) {
      if (child->getStyle().display() == YGDisplayNone ||
          child->getStyle().positionType() != YGPositionTypeAbsolute) {
        continue;
      }
      const bool absolutePercentageAgainstPaddingEdge =
          config->isExperimentalFeatureEnabled(
              YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge);

      layoutAbsoluteChild(
          node,
          child,
          absolutePercentageAgainstPaddingEdge
              ? node->getLayout().measuredDimensions[YGDimensionWidth]
              : availableInnerWidth,
          isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
          absolutePercentageAgainstPaddingEdge
              ? node->getLayout().measuredDimensions[YGDimensionHeight]
              : availableInnerHeight,
          direction,
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos = mainAxis == YGFlexDirectionRowReverse ||
        mainAxis == YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos = crossAxis == YGFlexDirectionRowReverse ||
        crossAxis == YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const auto child = node->getChild(i);
        if (child->getStyle().display() == YGDisplayNone) {
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
    const YGMeasureMode mode,
    const bool performLayout) {
  constexpr auto N = enums::count<YGMeasureMode>();
  const char* kMeasureModeNames[N] = {"UNDEFINED", "EXACTLY", "AT_MOST"};
  const char* kLayoutModeNames[N] = {
      "LAY_UNDEFINED", "LAY_EXACTLY", "LAY_AT_MOST"};

  if (mode >= N) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
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
    const YGDirection ownerDirection,
    const YGMeasureMode widthMeasureMode,
    const YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const yoga::Config* const config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
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
    layout->cachedLayout.widthMeasureMode = YGMeasureModeUndefined;
    layout->cachedLayout.heightMeasureMode = YGMeasureModeUndefined;
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
        node->getMarginForAxis(YGFlexDirectionRow, ownerWidth).unwrap();
    const float marginAxisColumn =
        node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth).unwrap();

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
            config)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
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
                config)) {
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
    layout->measuredDimensions[YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[YGDimensionHeight] =
        cachedResults->computedHeight;

    (performLayout ? layoutMarkerData.cachedLayouts
                   : layoutMarkerData.cachedMeasures) += 1;

    if (gPrintChanges && gPrintSkips) {
      yoga::log(
          node,
          YGLogLevelVerbose,
          nullptr,
          "%s%d.{[skipped] ",
          spacerWithLength(depth),
          depth);
      node->print(layoutContext);
      yoga::log(
          node,
          YGLogLevelVerbose,
          nullptr,
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
          YGLogLevelVerbose,
          nullptr,
          "%s%d.{%s",
          spacerWithLength(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      yoga::log(
          node,
          YGLogLevelVerbose,
          nullptr,
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
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount,
        reason);

    if (gPrintChanges) {
      yoga::log(
          node,
          YGLogLevelVerbose,
          nullptr,
          "%s%d.}%s",
          spacerWithLength(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      yoga::log(
          node,
          YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          measureModeName(widthMeasureMode, performLayout),
          measureModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[YGDimensionWidth],
          layout->measuredDimensions[YGDimensionHeight],
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
          yoga::log(
              node, YGLogLevelVerbose, nullptr, "Out of cache entries!\n");
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
          layout->measuredDimensions[YGDimensionWidth];
      newCacheEntry->computedHeight =
          layout->measuredDimensions[YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[YGDimensionWidth],
        YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[YGDimensionHeight],
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
  Event::publish<Event::NodeLayout>(node, {layoutType, layoutContext});

  return (needToVisitNode || cachedResults == nullptr);
}

void calculateLayout(
    yoga::Node* const node,
    const float ownerWidth,
    const float ownerHeight,
    const YGDirection ownerDirection,
    void* layoutContext) {
  Event::publish<Event::LayoutPassStart>(node, {layoutContext});
  LayoutData markerData = {};

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  gCurrentGenerationCount.fetch_add(1, std::memory_order_relaxed);
  node->resolveDimension();
  float width = YGUndefined;
  YGMeasureMode widthMeasureMode = YGMeasureModeUndefined;
  const auto& maxDimensions = node->getStyle().maxDimensions();
  if (styleDefinesDimension(node, YGFlexDirectionRow, ownerWidth)) {
    width =
        (yoga::resolveValue(
             node->getResolvedDimension(dim[YGFlexDirectionRow]), ownerWidth) +
         node->getMarginForAxis(YGFlexDirectionRow, ownerWidth))
            .unwrap();
    widthMeasureMode = YGMeasureModeExactly;
  } else if (!yoga::resolveValue(maxDimensions[YGDimensionWidth], ownerWidth)
                  .isUndefined()) {
    width = yoga::resolveValue(maxDimensions[YGDimensionWidth], ownerWidth)
                .unwrap();
    widthMeasureMode = YGMeasureModeAtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = yoga::isUndefined(width) ? YGMeasureModeUndefined
                                                : YGMeasureModeExactly;
  }

  float height = YGUndefined;
  YGMeasureMode heightMeasureMode = YGMeasureModeUndefined;
  if (styleDefinesDimension(node, YGFlexDirectionColumn, ownerHeight)) {
    height = (yoga::resolveValue(
                  node->getResolvedDimension(dim[YGFlexDirectionColumn]),
                  ownerHeight) +
              node->getMarginForAxis(YGFlexDirectionColumn, ownerWidth))
                 .unwrap();
    heightMeasureMode = YGMeasureModeExactly;
  } else if (!yoga::resolveValue(maxDimensions[YGDimensionHeight], ownerHeight)
                  .isUndefined()) {
    height = yoga::resolveValue(maxDimensions[YGDimensionHeight], ownerHeight)
                 .unwrap();
    heightMeasureMode = YGMeasureModeAtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = yoga::isUndefined(height) ? YGMeasureModeUndefined
                                                  : YGMeasureModeExactly;
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
          node->getConfig(),
          markerData,
          layoutContext,
          0, // tree root
          gCurrentGenerationCount.load(std::memory_order_relaxed))) {
    node->setPosition(
        node->getLayout().direction(), ownerWidth, ownerHeight, ownerWidth);
    roundLayoutResultsToPixelGrid(
        node, node->getConfig()->getPointScaleFactor(), 0.0f, 0.0f);

#ifdef DEBUG
    if (node->getConfig()->shouldPrintTree()) {
      YGNodePrint(
          node,
          (YGPrintOptions) (YGPrintOptionsLayout | YGPrintOptionsChildren | YGPrintOptionsStyle));
    }
#endif
  }

  Event::publish<Event::LayoutPassEnd>(node, {layoutContext, &markerData});
}

} // namespace facebook::yoga
