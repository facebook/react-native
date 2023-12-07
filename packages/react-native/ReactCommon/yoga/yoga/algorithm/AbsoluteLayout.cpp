/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/algorithm/AbsoluteLayout.h>
#include <yoga/algorithm/Align.h>
#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/ResolveValue.h>

namespace facebook::yoga {

/*
 * Absolutely positioned nodes do not participate in flex layout and thus their
 * positions can be determined independently from the rest of their siblings.
 * For each axis there are essentially two cases:
 *
 * 1) The node has insets defined. In this case we can just use these to
 *    determine the position of the node.
 * 2) The node does not have insets defined. In this case we look at the style
 *    of the parent to position the node. Things like justify content and
 *    align content will move absolute children around. If none of these
 *    special properties are defined, the child is positioned at the start
 *    (defined by flex direction) of the leading flex line.
 *
 * This function does that positioning for the given axis. The spec has more
 * information on this topic: https://www.w3.org/TR/css-flexbox-1/#abspos-items
 */
static void positionAbsoluteChild(
    const yoga::Node* const containingNode,
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection axis,
    const bool isMainAxis,
    const float containingBlockWidth,
    const float containingBlockHeight) {
  const bool isAxisRow = isRow(axis);
  const bool shouldCenter = isMainAxis
      ? parent->getStyle().justifyContent() == Justify::Center
      : resolveChildAlignment(parent, child) == Align::Center;
  const bool shouldFlexEnd = isMainAxis
      ? parent->getStyle().justifyContent() == Justify::FlexEnd
      : ((resolveChildAlignment(parent, child) == Align::FlexEnd) ^
         (parent->getStyle().flexWrap() == Wrap::WrapReverse));

  if (child->isFlexEndPositionDefined(axis, direction) &&
      !child->isFlexStartPositionDefined(axis, direction)) {
    child->setLayoutPosition(
        containingNode->getLayout().measuredDimension(dimension(axis)) -
            child->getLayout().measuredDimension(dimension(axis)) -
            containingNode->getFlexEndBorder(axis, direction) -
            child->getFlexEndMargin(
                axis,
                direction,
                isAxisRow ? containingBlockWidth : containingBlockHeight) -
            child->getFlexEndPosition(
                axis,
                direction,
                isAxisRow ? containingBlockWidth : containingBlockHeight),
        flexStartEdge(axis));
  } else if (
      !child->isFlexStartPositionDefined(axis, direction) && shouldCenter) {
    child->setLayoutPosition(
        (parent->getLayout().measuredDimension(dimension(axis)) -
         child->getLayout().measuredDimension(dimension(axis))) /
            2.0f,
        flexStartEdge(axis));
  } else if (
      !child->isFlexStartPositionDefined(axis, direction) && shouldFlexEnd) {
    child->setLayoutPosition(
        (parent->getLayout().measuredDimension(dimension(axis)) -
         child->getLayout().measuredDimension(dimension(axis))),
        flexStartEdge(axis));
  } else if (
      parent->getConfig()->isExperimentalFeatureEnabled(
          ExperimentalFeature::AbsolutePercentageAgainstPaddingEdge) &&
      child->isFlexStartPositionDefined(axis, direction)) {
    child->setLayoutPosition(
        child->getFlexStartPosition(
            axis,
            direction,
            containingNode->getLayout().measuredDimension(dimension(axis))) +
            containingNode->getFlexStartBorder(axis, direction) +
            child->getFlexStartMargin(
                axis,
                direction,
                isAxisRow ? containingBlockWidth : containingBlockHeight),
        flexStartEdge(axis));
  }
}

void layoutAbsoluteChild(
    const yoga::Node* const containingNode,
    const yoga::Node* const node,
    yoga::Node* const child,
    const float containingBlockWidth,
    const float containingBlockHeight,
    const SizingMode widthMode,
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
  SizingMode childWidthSizingMode = SizingMode::MaxContent;
  SizingMode childHeightSizingMode = SizingMode::MaxContent;

  auto marginRow =
      child->getMarginForAxis(FlexDirection::Row, containingBlockWidth);
  auto marginColumn =
      child->getMarginForAxis(FlexDirection::Column, containingBlockWidth);

  if (child->styleDefinesDimension(FlexDirection::Row, containingBlockWidth)) {
    childWidth =
        yoga::resolveValue(
            child->getResolvedDimension(Dimension::Width), containingBlockWidth)
            .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->isFlexStartPositionDefined(FlexDirection::Row, direction) &&
        child->isFlexEndPositionDefined(FlexDirection::Row, direction)) {
      childWidth =
          containingNode->getLayout().measuredDimension(Dimension::Width) -
          (containingNode->getFlexStartBorder(FlexDirection::Row, direction) +
           containingNode->getFlexEndBorder(FlexDirection::Row, direction)) -
          (child->getFlexStartPosition(
               FlexDirection::Row, direction, containingBlockWidth) +
           child->getFlexEndPosition(
               FlexDirection::Row, direction, containingBlockWidth));
      childWidth = boundAxis(
          child,
          FlexDirection::Row,
          childWidth,
          containingBlockWidth,
          containingBlockWidth);
    }
  }

  if (child->styleDefinesDimension(
          FlexDirection::Column, containingBlockHeight)) {
    childHeight = yoga::resolveValue(
                      child->getResolvedDimension(Dimension::Height),
                      containingBlockHeight)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based on
    // the top/bottom offsets if they're defined.
    if (child->isFlexStartPositionDefined(FlexDirection::Column, direction) &&
        child->isFlexEndPositionDefined(FlexDirection::Column, direction)) {
      childHeight =
          containingNode->getLayout().measuredDimension(Dimension::Height) -
          (containingNode->getFlexStartBorder(
               FlexDirection::Column, direction) +
           containingNode->getFlexEndBorder(FlexDirection::Column, direction)) -
          (child->getFlexStartPosition(
               FlexDirection::Column, direction, containingBlockHeight) +
           child->getFlexEndPosition(
               FlexDirection::Column, direction, containingBlockHeight));
      childHeight = boundAxis(
          child,
          FlexDirection::Column,
          childHeight,
          containingBlockHeight,
          containingBlockWidth);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const auto& childStyle = child->getStyle();
  if (yoga::isUndefined(childWidth) ^ yoga::isUndefined(childHeight)) {
    if (childStyle.aspectRatio().isDefined()) {
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
    childWidthSizingMode = yoga::isUndefined(childWidth)
        ? SizingMode::MaxContent
        : SizingMode::StretchFit;
    childHeightSizingMode = yoga::isUndefined(childHeight)
        ? SizingMode::MaxContent
        : SizingMode::StretchFit;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && yoga::isUndefined(childWidth) &&
        widthMode != SizingMode::MaxContent &&
        yoga::isDefined(containingBlockWidth) && containingBlockWidth > 0) {
      childWidth = containingBlockWidth;
      childWidthSizingMode = SizingMode::FitContent;
    }

    calculateLayoutInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthSizingMode,
        childHeightSizingMode,
        childWidth,
        childHeight,
        false,
        LayoutPassReason::kAbsMeasureChild,
        layoutMarkerData,
        depth,
        generationCount);
    childWidth = child->getLayout().measuredDimension(Dimension::Width) +
        child->getMarginForAxis(FlexDirection::Row, containingBlockWidth);
    childHeight = child->getLayout().measuredDimension(Dimension::Height) +
        child->getMarginForAxis(FlexDirection::Column, containingBlockWidth);
  }

  calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      SizingMode::StretchFit,
      SizingMode::StretchFit,
      childWidth,
      childHeight,
      true,
      LayoutPassReason::kAbsLayout,
      layoutMarkerData,
      depth,
      generationCount);

  positionAbsoluteChild(
      containingNode,
      node,
      child,
      direction,
      mainAxis,
      true /*isMainAxis*/,
      containingBlockWidth,
      containingBlockHeight);
  positionAbsoluteChild(
      containingNode,
      node,
      child,
      direction,
      crossAxis,
      false /*isMainAxis*/,
      containingBlockWidth,
      containingBlockHeight);
}

void layoutAbsoluteDescendants(
    yoga::Node* containingNode,
    yoga::Node* currentNode,
    SizingMode widthSizingMode,
    Direction currentNodeDirection,
    LayoutData& layoutMarkerData,
    uint32_t currentDepth,
    uint32_t generationCount,
    float currentNodeMainOffsetFromContainingBlock,
    float currentNodeCrossOffsetFromContainingBlock) {
  const FlexDirection mainAxis = resolveDirection(
      currentNode->getStyle().flexDirection(), currentNodeDirection);
  const FlexDirection crossAxis =
      resolveCrossDirection(mainAxis, currentNodeDirection);
  for (auto child : currentNode->getChildren()) {
    if (child->getStyle().display() == Display::None) {
      continue;
    } else if (child->getStyle().positionType() == PositionType::Absolute) {
      layoutAbsoluteChild(
          containingNode,
          currentNode,
          child,
          containingNode->getLayout().measuredDimension(Dimension::Width),
          containingNode->getLayout().measuredDimension(Dimension::Height),
          widthSizingMode,
          currentNodeDirection,
          layoutMarkerData,
          currentDepth,
          generationCount);

      const bool isMainAxisRow = isRow(mainAxis);
      const bool mainInsetsDefined = isMainAxisRow
          ? child->getStyle().horizontalInsetsDefined()
          : child->getStyle().verticalInsetsDefined();
      const bool crossInsetsDefined = isMainAxisRow
          ? child->getStyle().verticalInsetsDefined()
          : child->getStyle().horizontalInsetsDefined();

      const float childMainOffsetFromParent = mainInsetsDefined
          ? (child->getLayout().position(flexStartEdge(mainAxis)) -
             currentNodeMainOffsetFromContainingBlock)
          : child->getLayout().position(flexStartEdge(mainAxis));
      const float childCrossOffsetFromParent = crossInsetsDefined
          ? (child->getLayout().position(flexStartEdge(crossAxis)) -
             currentNodeCrossOffsetFromContainingBlock)
          : child->getLayout().position(flexStartEdge(crossAxis));

      child->setLayoutPosition(
          childMainOffsetFromParent, flexStartEdge(mainAxis));
      child->setLayoutPosition(
          childCrossOffsetFromParent, flexStartEdge(crossAxis));

      if (needsTrailingPosition(mainAxis)) {
        setChildTrailingPosition(currentNode, child, mainAxis);
      }
      if (needsTrailingPosition(crossAxis)) {
        setChildTrailingPosition(currentNode, child, crossAxis);
      }
    } else if (child->getStyle().positionType() == PositionType::Static) {
      const Direction childDirection =
          child->resolveDirection(currentNodeDirection);
      const float childMainOffsetFromContainingBlock =
          currentNodeMainOffsetFromContainingBlock +
          child->getLayout().position(flexStartEdge(mainAxis));
      const float childCrossOffsetFromContainingBlock =
          currentNodeCrossOffsetFromContainingBlock +
          child->getLayout().position(flexStartEdge(crossAxis));

      layoutAbsoluteDescendants(
          containingNode,
          child,
          widthSizingMode,
          childDirection,
          layoutMarkerData,
          currentDepth + 1,
          generationCount,
          childMainOffsetFromContainingBlock,
          childCrossOffsetFromContainingBlock);
    }
  }
}
} // namespace facebook::yoga
