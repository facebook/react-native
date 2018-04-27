/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"

#include <algorithm>

#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

#pragma mark - Constructors

ViewShadowNode::ViewShadowNode(
  const Tag &tag,
  const Tag &rootTag,
  const InstanceHandle &instanceHandle,
  const SharedViewProps &props,
  const SharedShadowNodeSharedList &children,
  const ShadowNodeCloneFunction &cloneFunction
):
  ConcreteShadowNode(
    tag,
    rootTag,
    instanceHandle,
    props,
    children,
    cloneFunction
  ),
  AccessibleShadowNode(
    props
  ),
  YogaLayoutableShadowNode(
    props,
    children
  ) {};

ViewShadowNode::ViewShadowNode(
  const SharedViewShadowNode &shadowNode,
  const SharedViewProps &props,
  const SharedShadowNodeSharedList &children
):
  ConcreteShadowNode(
    shadowNode,
    props,
    children
  ),
  AccessibleShadowNode(
    shadowNode,
    props
  ),
  YogaLayoutableShadowNode(
    shadowNode,
    props,
    children
  ) {};

ComponentName ViewShadowNode::getComponentName() const {
  return ComponentName("View");
}

void ViewShadowNode::appendChild(const SharedShadowNode &child) {
  ensureUnsealed();

  ShadowNode::appendChild(child);

  auto yogaLayoutableChild = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(child);
  if (yogaLayoutableChild) {
    YogaLayoutableShadowNode::appendChild(yogaLayoutableChild);
  }
}

#pragma mark - YogaLayoutableShadowNode

SharedLayoutableShadowNodeList ViewShadowNode::getLayoutableChildNodes() const {
  SharedLayoutableShadowNodeList sharedLayoutableShadowNodeList = {};
  for (auto child : *children_) {
    const SharedLayoutableShadowNode layoutableShadowNode = std::dynamic_pointer_cast<const LayoutableShadowNode>(child);
    if (!layoutableShadowNode) {
      continue;
    }

    sharedLayoutableShadowNodeList.push_back(layoutableShadowNode);
  }

  return sharedLayoutableShadowNodeList;
}

SharedLayoutableShadowNode ViewShadowNode::cloneAndReplaceChild(const SharedLayoutableShadowNode &child) {
  ensureUnsealed();

  auto childShadowNode = std::dynamic_pointer_cast<const ShadowNode>(child);
  assert(childShadowNode);
  auto childShadowNodeClone = childShadowNode->clone();

  // This is overloading of `SharedLayoutableShadowNode::cloneAndReplaceChild`,
  // the method is used to clone some node as a preparation for future mutation
  // caused by relayout.
  // Because those changes are not requested by UIManager, they add a layer
  // of node generation (between the committed stage and new proposed stage).
  // That additional layer confuses the Diffing algorithm which uses
  // `sourceNode` for referencing the previous (aka committed) stage
  // of the tree to produce mutation instructions.
  // In other words, if we don't compensate this change here,
  // the Diffing algorithm will compare wrong trees
  // ("new-but-not-laid-out-yet vs. new" instead of "committed vs. new").
  auto nonConstChildShadowNodeClone = std::const_pointer_cast<ShadowNode>(childShadowNodeClone);
  nonConstChildShadowNodeClone->shallowSourceNode();

  ShadowNode::replaceChild(childShadowNode, childShadowNodeClone);
  return std::dynamic_pointer_cast<const LayoutableShadowNode>(childShadowNodeClone);
}

#pragma mark - Equality

bool ViewShadowNode::operator==(const ShadowNode& rhs) const {
  if (!ShadowNode::operator==(rhs)) {
    return false;
  }

  auto &&other = static_cast<const ViewShadowNode&>(rhs);
  return getLayoutMetrics() == other.getLayoutMetrics();
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ViewShadowNode::getDebugProps() const {
  SharedDebugStringConvertibleList list = {};

  auto basePropsList = ShadowNode::getDebugProps();
  std::move(basePropsList.begin(), basePropsList.end(), std::back_inserter(list));

  list.push_back(std::make_shared<DebugStringConvertibleItem>("layout", "", YogaLayoutableShadowNode::getDebugProps()));

  return list;
}

} // namespace react
} // namespace facebook
