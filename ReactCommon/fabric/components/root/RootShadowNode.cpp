/*
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

bool RootShadowNode::layoutIfNeeded(
    std::vector<LayoutableShadowNode const *> *affectedNodes) {
  SystraceSection s("RootShadowNode::layout");

  if (getIsLayoutClean()) {
    return false;
  }

  ensureUnsealed();

  auto layoutContext = getConcreteProps().layoutContext;
  layoutContext.affectedNodes = affectedNodes;

  layoutTree(layoutContext, getConcreteProps().layoutConstraints);

  return true;
}

RootShadowNode::Unshared RootShadowNode::clone(
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const {
  auto props = std::make_shared<RootProps const>(
      getConcreteProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *this,
      ShadowNodeFragment{
          /* .props = */ props,
      });
  return newRootShadowNode;
}

} // namespace react
} // namespace facebook
