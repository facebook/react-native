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

float calculateBaseline(const yoga::Node* node) {
  if (node->hasBaselineFunc()) {
    Event::publish<Event::NodeBaselineStart>(node);

    const float baseline = node->baseline(
        node->getLayout().measuredDimension(Dimension::Width),
        node->getLayout().measuredDimension(Dimension::Height));

    Event::publish<Event::NodeBaselineEnd>(node);

    yoga::assertFatalWithNode(
        node,
        !std::isnan(baseline),
        "Expect custom baseline function to not return NaN");
    return baseline;
  }

  yoga::Node* baselineChild = nullptr;
  const size_t childCount = node->getChildCount();
  for (size_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->style().positionType() == PositionType::Absolute) {
      continue;
    }
    if (resolveChildAlignment(node, child) == Align::Baseline ||
        child->isReferenceBaseline()) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->getLayout().measuredDimension(Dimension::Height);
  }

  const float baseline = calculateBaseline(baselineChild);
  return baseline + baselineChild->getLayout().position(PhysicalEdge::Top);
}

bool isBaselineLayout(const yoga::Node* node) {
  if (isColumn(node->style().flexDirection())) {
    return false;
  }
  if (node->style().alignItems() == Align::Baseline) {
    return true;
  }
  const auto childCount = node->getChildCount();
  for (size_t i = 0; i < childCount; i++) {
    auto child = node->getChild(i);
    if (child->style().positionType() != PositionType::Absolute &&
        child->style().alignSelf() == Align::Baseline) {
      return true;
    }
  }

  return false;
}

} // namespace facebook::yoga
