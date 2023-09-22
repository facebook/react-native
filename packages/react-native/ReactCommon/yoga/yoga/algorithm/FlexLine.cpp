/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>

#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/FlexLine.h>

namespace facebook::yoga {

FlexLine calculateFlexLine(
    yoga::Node* const node,
    const Direction ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const size_t startOfLineIndex,
    const size_t lineCount) {
  std::vector<yoga::Node*> itemsInFlow;
  itemsInFlow.reserve(node->getChildren().size());

  float sizeConsumed = 0.0f;
  float totalFlexGrowFactors = 0.0f;
  float totalFlexShrinkScaledFactors = 0.0f;
  size_t endOfLineIndex = startOfLineIndex;

  float sizeConsumedIncludingMinConstraint = 0;
  const FlexDirection mainAxis = resolveDirection(
      node->getStyle().flexDirection(), node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != Wrap::NoWrap;
  const float gap = node->getGapForAxis(mainAxis, availableInnerWidth).unwrap();

  // Add items to the current line until it's full or we run out of items.
  for (; endOfLineIndex < node->getChildren().size(); endOfLineIndex++) {
    auto child = node->getChild(endOfLineIndex);
    if (child->getStyle().display() == Display::None ||
        child->getStyle().positionType() == PositionType::Absolute) {
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
    if (sizeConsumedIncludingMinConstraint + flexBasisWithMinAndMaxConstraints +
                childMarginMainAxis + childLeadingGapMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && itemsInFlow.size() > 0) {
      break;
    }

    sizeConsumedIncludingMinConstraint += flexBasisWithMinAndMaxConstraints +
        childMarginMainAxis + childLeadingGapMainAxis;
    sizeConsumed += flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;

    if (child->isNodeFlexible()) {
      totalFlexGrowFactors += child->resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      totalFlexShrinkScaledFactors += -child->resolveFlexShrink() *
          child->getLayout().computedFlexBasis.unwrap();
    }

    itemsInFlow.push_back(child);
  }

  // The total flex factor needs to be floored to 1.
  if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
    totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
    totalFlexShrinkScaledFactors = 1;
  }

  return FlexLine{
      std::move(itemsInFlow),
      sizeConsumed,
      endOfLineIndex,
      FlexLineRunningLayout{
          totalFlexGrowFactors,
          totalFlexShrinkScaledFactors,
      }};
}

} // namespace facebook::yoga
