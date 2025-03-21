/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FocusOrderingHelper.h"
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

void FocusOrderingHelper::traverseAndUpdateNextFocusableElementMetrics(
    const ShadowNode::Shared& parentShadowNode,
    const ShadowNode::Shared& focusedShadowNode,
    const ShadowNode::Shared& currNode,
    FocusDirection focusDirection,
    const UIManager& uimanager,
    float& currentDelta,
    float& nextDelta,
    ShadowNode::Shared& nextNode,
    ShadowNode::Shared& topmostParent,
    const ShadowNode::Shared& currentParent = nullptr) {
  const auto* props =
      dynamic_cast<const ViewProps*>(currNode->getProps().get());

  // We only care about focusable elements since only they can be both
  // focused and present in the hierarchy
  if (props != nullptr && (props->focusable || props->accessible)) {
    LayoutMetrics nodeLayoutMetrics = uimanager.getRelativeLayoutMetrics(
        *currNode, parentShadowNode.get(), {.includeTransform = true});

    switch (focusDirection) {
      case FocusDirection::FocusDown:
        if (nodeLayoutMetrics.frame.origin.y > currentDelta &&
            nodeLayoutMetrics.frame.origin.y < nextDelta &&
            currNode != focusedShadowNode) {
          nextNode = currNode;
          nextDelta = nodeLayoutMetrics.frame.origin.y;
          topmostParent = currentParent ? currentParent : currNode;
        }
        break;
      case FocusDirection::FocusUp:
        if (nodeLayoutMetrics.frame.origin.y < currentDelta &&
            nodeLayoutMetrics.frame.origin.y > nextDelta &&
            currNode != focusedShadowNode) {
          nextNode = currNode;
          nextDelta = nodeLayoutMetrics.frame.origin.y;
          topmostParent = currentParent ? currentParent : currNode;
        }
        break;
      case FocusDirection::FocusRight:
        if (nodeLayoutMetrics.frame.origin.x > currentDelta &&
            nodeLayoutMetrics.frame.origin.x < nextDelta &&
            currNode != focusedShadowNode) {
          nextNode = currNode;
          nextDelta = nodeLayoutMetrics.frame.origin.x;
          topmostParent = currentParent ? currentParent : currNode;
        }
        break;
      case FocusDirection::FocusLeft:
        if (nodeLayoutMetrics.frame.origin.x < currentDelta &&
            nodeLayoutMetrics.frame.origin.x > nextDelta &&
            currNode != focusedShadowNode) {
          nextNode = currNode;
          nextDelta = nodeLayoutMetrics.frame.origin.x;
          topmostParent = currentParent ? currentParent : currNode;
        }
        break;
    }
  }

  for (auto& child : currNode->getChildren()) {
    if (child->getTraits().check(ShadowNodeTraits::Trait::RootNodeKind)) {
      continue;
    }

    /*
     * Pass the current node as the parent for its children if it forms a
     * Stacking Context, this is because later the tree will be flattened and if
     * the parent doesn't form a Stacking Context it'll become a sibling
     */
    ShadowNode::Shared nextParent;
    if (child->getTraits().check(
            ShadowNodeTraits::Trait::FormsStackingContext)) {
      nextParent = currentParent ? currentParent : child;
    }

    traverseAndUpdateNextFocusableElementMetrics(
        parentShadowNode,
        focusedShadowNode,
        child,
        focusDirection,
        uimanager,
        currentDelta,
        nextDelta,
        nextNode,
        topmostParent,
        nextParent);
  };
};

ShadowNode::Shared FocusOrderingHelper::findShadowNodeByTagRecursively(
    const ShadowNode::Shared& parentShadowNode,
    Tag tag) {
  if (parentShadowNode->getTag() == tag) {
    return parentShadowNode;
  }

  for (auto& shadowNode : parentShadowNode->getChildren()) {
    if (auto result = findShadowNodeByTagRecursively(shadowNode, tag)) {
      return result;
    }
  }

  return nullptr;
}

std::optional<FocusDirection> FocusOrderingHelper::resolveFocusDirection(
    int direction) {
  switch (static_cast<FocusDirection>(direction)) {
    case FocusDirection::FocusDown:
    case FocusDirection::FocusUp:
    case FocusDirection::FocusRight:
    case FocusDirection::FocusLeft:
      return static_cast<FocusDirection>(direction);
  }

  return std::nullopt;
}

std::tuple<float, float> FocusOrderingHelper::initScrollDeltas(
    FocusDirection focusDirection,
    Point refPoint) {
  float currentDelta = 0;
  float nextDelta = 0;

  switch (focusDirection) {
    case FocusDirection::FocusDown:
      currentDelta = refPoint.y;
      nextDelta = std::numeric_limits<float>::max();
      break;
    case FocusDirection::FocusUp:
      currentDelta = refPoint.y;
      nextDelta = -std::numeric_limits<float>::max();
      break;
    case FocusDirection::FocusRight:
      currentDelta = refPoint.x;
      nextDelta = std::numeric_limits<float>::max();
      break;
    case FocusDirection::FocusLeft:
      currentDelta = refPoint.x;
      nextDelta = -std::numeric_limits<float>::max();
      break;
  }
  return std::make_tuple(currentDelta, nextDelta);
}
} // namespace facebook::react
