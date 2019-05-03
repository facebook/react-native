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

void RootShadowNode::layout(
    std::vector<LayoutableShadowNode const *> *affectedNodes) {
  SystraceSection s("RootShadowNode::layout");
  ensureUnsealed();

  auto layoutContext = getProps()->layoutContext;
  layoutContext.affectedNodes = affectedNodes;

  layout(layoutContext);

  // This is the rare place where shadow node must layout (set `layoutMetrics`)
  // itself because there is no a parent node which usually should do it.
  if (getHasNewLayout()) {
    setLayoutMetrics(layoutMetricsFromYogaNode(yogaNode_));
    setHasNewLayout(false);
  }
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
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
      });
  return newRootShadowNode;
}

UnsharedRootShadowNode RootShadowNode::clone(
    SharedShadowNode const &oldShadowNode,
    SharedShadowNode const &newShadowNode) const {
  auto ancestors = oldShadowNode->getAncestors(*this);

  if (ancestors.size() == 0) {
    return UnsharedRootShadowNode{nullptr};
  }

  auto childNode = newShadowNode;

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); ++it) {
    auto &parentNode = it->first.get();
    auto childIndex = it->second;

    auto children = parentNode.getChildren();
    assert(ShadowNode::sameFamily(*children.at(childIndex), *childNode));
    children[childIndex] = childNode;

    childNode = parentNode.clone({
        ShadowNodeFragment::tagPlaceholder(),
        ShadowNodeFragment::surfaceIdPlaceholder(),
        ShadowNodeFragment::propsPlaceholder(),
        ShadowNodeFragment::eventEmitterPlaceholder(),
        std::make_shared<SharedShadowNodeList>(children),
    });
  }

  return std::const_pointer_cast<RootShadowNode>(
      std::static_pointer_cast<RootShadowNode const>(childNode));
}

} // namespace react
} // namespace facebook
