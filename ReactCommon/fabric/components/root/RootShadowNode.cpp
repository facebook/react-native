/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootShadowNode.h"

#include <react/components/view/conversions.h>
#include <react/debug/SystraceSection.h>

namespace facebook {
namespace react {

const char RootComponentName[] = "RootView";

void RootShadowNode::layout() {
  SystraceSection s("RootShadowNode::layout");
  ensureUnsealed();
  layout(getProps()->layoutContext);

  // This is the rare place where shadow node must layout (set `layoutMetrics`)
  // itself because there is no a parent node which usually should do it.
  setLayoutMetrics(layoutMetricsFromYogaNode(yogaNode_));
}

UnsharedRootShadowNode RootShadowNode::clone(
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  auto props = std::make_shared<const RootProps>(
      *getProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *this,
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .rootTag = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
      });
  return newRootShadowNode;
}

UnsharedRootShadowNode RootShadowNode::clone(
    const SharedShadowNode &oldShadowNode,
    const SharedShadowNode &newShadowNode) const {
  std::vector<std::reference_wrapper<const ShadowNode>> ancestors;

  if (!oldShadowNode->constructAncestorPath(*this, ancestors)) {
    return UnsharedRootShadowNode{nullptr};
  }

  auto oldChild = oldShadowNode;
  auto newChild = newShadowNode;

  for (const auto &ancestor : ancestors) {
    auto oldParent = ancestor.get().shared_from_this();

    auto children = oldParent->getChildren();
    std::replace(children.begin(), children.end(), oldChild, newChild);

    auto sharedChildren = std::make_shared<SharedShadowNodeList>(children);
    auto newParent = oldParent->clone({
        /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
        /* .rootTag = */ ShadowNodeFragment::surfaceIdPlaceholder(),
        /* .props = */ ShadowNodeFragment::propsPlaceholder(),
        /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
        /* .children = */ sharedChildren,
    });

    newParent->replaceChild(oldChild, newChild);

    oldChild = oldParent;
    newChild = newParent;
  }

  return std::const_pointer_cast<RootShadowNode>(
      std::static_pointer_cast<const RootShadowNode>(newChild));
}

} // namespace react
} // namespace facebook
