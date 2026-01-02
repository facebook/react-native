/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceHandlerCommitHook.h"

namespace facebook::react {

SurfaceHandlerCommitHook::SurfaceHandlerCommitHook(SurfaceId surfaceId)
    : surfaceId_(surfaceId) {}

RootShadowNode::Unshared SurfaceHandlerCommitHook::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTreeCommitOptions& /*commitOptions*/) noexcept {
  // Commit for another surface
  if (surfaceId_ != shadowTree.getSurfaceId()) {
    return newRootShadowNode;
  }

  LayoutConstraints layoutConstraints;
  LayoutContext layoutContext;

  {
    std::shared_lock lock(mutex_);

    // Layout constraints were not set
    if (!layoutConstraints_.has_value() || !layoutContext_.has_value()) {
      return newRootShadowNode;
    }

    layoutConstraints = layoutConstraints_.value();
    layoutContext = layoutContext_.value();
  }

  // Don't clone the root node if the layout constraints and layout context
  // are not changed
  if (newRootShadowNode->getConcreteProps().layoutConstraints ==
          layoutConstraints &&
      newRootShadowNode->getConcreteProps().layoutContext == layoutContext) {
    return newRootShadowNode;
  }

  PropsParserContext propsParserContext{surfaceId_, *contextContainer_};

  auto clonedRoot = newRootShadowNode->clone(
      propsParserContext, layoutConstraints, layoutContext);

  // Dirty all measurable nodes when the fontSizeMultiplier changes to
  // trigger re-measurement.
  if (ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout() &&
      layoutContext.fontSizeMultiplier !=
          newRootShadowNode->getConcreteProps()
              .layoutContext.fontSizeMultiplier) {
    dirtyMeasurableNodes(*clonedRoot);
  }

  return clonedRoot;
}

std::shared_ptr<const ShadowNode>
SurfaceHandlerCommitHook::dirtyMeasurableNodesRecursive(
    std::shared_ptr<const ShadowNode> node) const {
  const auto nodeHasChildren = !node->getChildren().empty();
  const auto isMeasurableYogaNode =
      node->getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode);

  // Node is not measurable and has no children, its layout will not be affected
  if (!nodeHasChildren && !isMeasurableYogaNode) {
    return nullptr;
  }

  ShadowNode::SharedListOfShared newChildren =
      ShadowNodeFragment::childrenPlaceholder();

  if (nodeHasChildren) {
    std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>>
        newChildrenMutable = nullptr;
    for (size_t i = 0; i < node->getChildren().size(); i++) {
      const auto& child = node->getChildren()[i];

      if (const auto& layoutableNode =
              std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(
                  child)) {
        auto newChild = dirtyMeasurableNodesRecursive(layoutableNode);

        if (newChild != nullptr) {
          if (newChildrenMutable == nullptr) {
            newChildrenMutable = std::make_shared<
                std::vector<std::shared_ptr<const ShadowNode>>>(
                node->getChildren());
            newChildren = newChildrenMutable;
          }

          (*newChildrenMutable)[i] = newChild;
        }
      }
    }

    // Node is not measurable and its children were not dirtied, its layout will
    // not be affected
    if (!isMeasurableYogaNode && newChildrenMutable == nullptr) {
      return nullptr;
    }
  }

  const auto newNode = node->getComponentDescriptor().cloneShadowNode(
      *node,
      {
          .children = newChildren,
          // Preserve the original state of the node
          .state = node->getState(),
      });

  if (isMeasurableYogaNode) {
    std::static_pointer_cast<YogaLayoutableShadowNode>(newNode)->dirtyLayout();
  }

  return newNode;
}

void SurfaceHandlerCommitHook::dirtyMeasurableNodes(ShadowNode& root) const {
  for (const auto& child : root.getChildren()) {
    if (const auto& layoutableNode =
            std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(child)) {
      const auto newChild = dirtyMeasurableNodesRecursive(layoutableNode);
      if (newChild != nullptr) {
        root.replaceChild(*child, newChild);
      }
    }
  }
}

void SurfaceHandlerCommitHook::setContextContainer(
    std::shared_ptr<const ContextContainer> contextContainer) {
  contextContainer_ = std::move(contextContainer);
}

void SurfaceHandlerCommitHook::setLayoutConstraints(
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) {
  std::unique_lock lock(mutex_);
  layoutConstraints_ = layoutConstraints;
  layoutContext_ = layoutContext;
}

void SurfaceHandlerCommitHook::setSurfaceId(SurfaceId surfaceId) {
  surfaceId_ = surfaceId;
}

} // namespace facebook::react
