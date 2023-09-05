/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>

#include <yoga/algorithm/Align.h>
#include <yoga/algorithm/Baseline.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/event/event.h>

namespace facebook::yoga {

float calculateBaseline(const yoga::Node* node, void* layoutContext) {
  if (node->hasBaselineFunc()) {

    Event::publish<Event::NodeBaselineStart>(node);

    const float baseline = node->baseline(
        node->getLayout().measuredDimensions[YGDimensionWidth],
        node->getLayout().measuredDimensions[YGDimensionHeight],
        layoutContext);

    Event::publish<Event::NodeBaselineEnd>(node);

    yoga::assertFatalWithNode(
        node,
        !std::isnan(baseline),
        "Expect custom baseline function to not return NaN");
    return baseline;
  }

  yoga::Node* baselineChild = nullptr;
  const uint32_t childCount = YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->getStyle().positionType() == YGPositionTypeAbsolute) {
      continue;
    }
    if (resolveChildAlignment(node, child) == YGAlignBaseline ||
        child->isReferenceBaseline()) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->getLayout().measuredDimensions[YGDimensionHeight];
  }

  const float baseline = calculateBaseline(baselineChild, layoutContext);
  return baseline + baselineChild->getLayout().position[YGEdgeTop];
}

} // namespace facebook::yoga
