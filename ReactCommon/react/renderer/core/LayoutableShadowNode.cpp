/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutableShadowNode.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

LayoutMetrics LayoutableShadowNode::computeRelativeLayoutMetrics(
    ShadowNodeFamily const &descendantNodeFamily,
    LayoutableShadowNode const &ancestorNode,
    LayoutInspectingPolicy policy) {
  if (&descendantNodeFamily == &ancestorNode.getFamily()) {
    // Layout metrics of a node computed relatively to the same node are equal
    // to `transform`-ed layout metrics of the node with zero `origin`.
    auto layoutMetrics = ancestorNode.getLayoutMetrics();
    if (policy.includeTransform) {
      layoutMetrics.frame = layoutMetrics.frame * ancestorNode.getTransform();
    }
    layoutMetrics.frame.origin = {0, 0};
    return layoutMetrics;
  }

  auto ancestors = descendantNodeFamily.getAncestors(ancestorNode);

  if (ancestors.size() == 0) {
    // Specified nodes do not form an ancestor-descender relationship
    // in the same tree. Aborting.
    return EmptyLayoutMetrics;
  }

  // Step 1.
  // Creating a list of nodes that form a chain from the descender node to
  // ancestor node inclusively.
  auto shadowNodeList = better::small_vector<ShadowNode const *, 16>{};

  // Finding the measured node.
  // The last element in the `AncestorList` is a pair of a parent of the node
  // and an index of this node in the parent's children list.
  auto &pair = ancestors.at(ancestors.size() - 1);
  auto descendantNode = pair.first.get().getChildren().at(pair.second).get();

  // Putting the node inside the list.
  // Even if this is a node with a `RootNodeKind` trait, we don't treat it as
  // root because we measure it from an outside tree perspective.
  shadowNodeList.push_back(descendantNode);

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); it++) {
    auto &shadowNode = it->first.get();

    shadowNodeList.push_back(&shadowNode);

    if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::RootNodeKind)) {
      // If this is a node with a `RootNodeKind` trait, we need to stop right
      // there.
      break;
    }
  }

  // Step 2.
  // Computing the initial size of the measured node.
  auto descendantLayoutableNode =
      traitCast<LayoutableShadowNode const *>(descendantNode);

  if (!descendantLayoutableNode) {
    return EmptyLayoutMetrics;
  }

  auto layoutMetrics = descendantLayoutableNode->getLayoutMetrics();
  auto &resultFrame = layoutMetrics.frame;
  resultFrame.origin = {0, 0};

  // Step 3.
  // Iterating on a list of nodes computing compound offset.
  auto size = shadowNodeList.size();
  for (size_t i = 0; i < size; i++) {
    auto currentShadowNode =
        traitCast<LayoutableShadowNode const *>(shadowNodeList.at(i));

    if (!currentShadowNode) {
      return EmptyLayoutMetrics;
    }

    auto currentFrame = currentShadowNode->getLayoutMetrics().frame;
    if (i == size - 1) {
      // If it's the last element, its origin is irrelevant.
      currentFrame.origin = {0, 0};
    }

    auto isRootNode = currentShadowNode->getTraits().check(
        ShadowNodeTraits::Trait::RootNodeKind);
    auto shouldApplyTransformation = (policy.includeTransform && !isRootNode) ||
        (policy.includeViewportOffset && isRootNode);

    if (shouldApplyTransformation) {
      resultFrame.size = resultFrame.size * currentShadowNode->getTransform();
      currentFrame = currentFrame * currentShadowNode->getTransform();
    }

    resultFrame.origin += currentFrame.origin;

    if (i != 0 && policy.includeTransform) {
      resultFrame.origin += currentShadowNode->getContentOriginOffset();
    }
  }

  return layoutMetrics;
}

LayoutableShadowNode::LayoutableShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : ShadowNode(fragment, family, traits), layoutMetrics_({}) {}

LayoutableShadowNode::LayoutableShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : ShadowNode(sourceShadowNode, fragment),
      layoutMetrics_(static_cast<LayoutableShadowNode const &>(sourceShadowNode)
                         .layoutMetrics_) {}

ShadowNodeTraits LayoutableShadowNode::BaseTraits() {
  auto traits = ShadowNodeTraits{};
  traits.set(ShadowNodeTraits::Trait::LayoutableKind);
  return traits;
}

LayoutMetrics LayoutableShadowNode::getLayoutMetrics() const {
  return layoutMetrics_;
}

void LayoutableShadowNode::setLayoutMetrics(LayoutMetrics layoutMetrics) {
  ensureUnsealed();

  if (layoutMetrics_ == layoutMetrics) {
    return;
  }

  layoutMetrics_ = layoutMetrics;
}

Transform LayoutableShadowNode::getTransform() const {
  return Transform::Identity();
}

Point LayoutableShadowNode::getContentOriginOffset() const {
  return {0, 0};
}

LayoutMetrics LayoutableShadowNode::getRelativeLayoutMetrics(
    LayoutableShadowNode const &ancestorLayoutableShadowNode,
    LayoutInspectingPolicy policy) const {
  return computeRelativeLayoutMetrics(
      getFamily(), ancestorLayoutableShadowNode, policy);
}

LayoutableShadowNode::UnsharedList
LayoutableShadowNode::getLayoutableChildNodes() const {
  LayoutableShadowNode::UnsharedList layoutableChildren;
  for (const auto &childShadowNode : getChildren()) {
    auto layoutableChildShadowNode =
        traitCast<LayoutableShadowNode const *>(childShadowNode.get());
    if (layoutableChildShadowNode) {
      layoutableChildren.push_back(
          const_cast<LayoutableShadowNode *>(layoutableChildShadowNode));
    }
  }
  return layoutableChildren;
}

Size LayoutableShadowNode::measureContent(
    LayoutContext const &layoutContext,
    LayoutConstraints const &layoutConstraints) const {
  return Size();
}

Size LayoutableShadowNode::measure(
    LayoutContext const &layoutContext,
    LayoutConstraints const &layoutConstraints) const {
  auto clonedShadowNode = clone({});
  auto &layoutableShadowNode =
      static_cast<LayoutableShadowNode &>(*clonedShadowNode);

  auto localLayoutContext = layoutContext;
  localLayoutContext.affectedNodes = nullptr;

  layoutableShadowNode.layoutTree(localLayoutContext, layoutConstraints);

  return layoutableShadowNode.getLayoutMetrics().frame.size;
}

Float LayoutableShadowNode::firstBaseline(Size size) const {
  return 0;
}

Float LayoutableShadowNode::lastBaseline(Size size) const {
  return 0;
}

void LayoutableShadowNode::layoutTree(
    LayoutContext layoutContext,
    LayoutConstraints layoutConstraints) {
  // Default implementation does nothing.
}

void LayoutableShadowNode::layout(LayoutContext layoutContext) {
  // Default implementation does nothing.
}

ShadowNode::Shared LayoutableShadowNode::findNodeAtPoint(
    ShadowNode::Shared node,
    Point point) {
  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(node.get());

  if (!layoutableShadowNode) {
    return nullptr;
  }
  auto frame = layoutableShadowNode->getLayoutMetrics().frame;
  auto transformedFrame = frame * layoutableShadowNode->getTransform();
  auto isPointInside = transformedFrame.containsPoint(point);

  if (!isPointInside) {
    return nullptr;
  }

  auto newPoint = point - transformedFrame.origin -
      layoutableShadowNode->getContentOriginOffset();

  auto sortedChildren = node->getChildren();
  std::stable_sort(
      sortedChildren.begin(),
      sortedChildren.end(),
      [](auto const &lhs, auto const &rhs) -> bool {
        return lhs->getOrderIndex() < rhs->getOrderIndex();
      });

  for (auto it = sortedChildren.rbegin(); it != sortedChildren.rend(); it++) {
    auto const &childShadowNode = *it;
    auto hitView = findNodeAtPoint(childShadowNode, newPoint);
    if (hitView) {
      return hitView;
    }
  }
  return isPointInside ? node : nullptr;
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList LayoutableShadowNode::getDebugProps() const {
  auto list = SharedDebugStringConvertibleList{};

  if (!getIsLayoutClean()) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("dirty"));
  }

  auto layoutMetrics = getLayoutMetrics();
  auto defaultLayoutMetrics = LayoutMetrics();

  list.push_back(std::make_shared<DebugStringConvertibleItem>(
      "frame", toString(layoutMetrics.frame)));

  if (layoutMetrics.borderWidth != defaultLayoutMetrics.borderWidth) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "borderWidth", toString(layoutMetrics.borderWidth)));
  }

  if (layoutMetrics.contentInsets != defaultLayoutMetrics.contentInsets) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "contentInsets", toString(layoutMetrics.contentInsets)));
  }

  if (layoutMetrics.displayType == DisplayType::None) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("hidden"));
  }

  if (layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("rtl"));
  }

  return list;
}
#endif

} // namespace react
} // namespace facebook
