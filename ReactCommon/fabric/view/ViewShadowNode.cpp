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
  const SharedShadowNodeSharedList &children
):
  ConcreteShadowNode(
    tag,
    rootTag,
    instanceHandle,
    props,
    children
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

SharedLayoutableShadowNodeList ViewShadowNode::getChildren() const {
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

  // We cannot mutate `children_` in place here because it is a *shared*
  // data structure which means other `ShadowNodes` might refer to its old value.
  // So, we have to clone this and only then mutate.
  auto nonConstChildrenCopy = SharedShadowNodeList(*children_);

  auto viewShadowNodeChild = std::dynamic_pointer_cast<const ViewShadowNode>(child);
  assert(viewShadowNodeChild);

  auto viewShadowNodeChildClone = std::make_shared<const ViewShadowNode>(viewShadowNodeChild);

  std::replace(
    nonConstChildrenCopy.begin(),
    nonConstChildrenCopy.end(),
    std::static_pointer_cast<const ShadowNode>(viewShadowNodeChild),
    std::static_pointer_cast<const ShadowNode>(viewShadowNodeChildClone)
  );

  children_ = std::make_shared<const SharedShadowNodeList>(nonConstChildrenCopy);

  return std::static_pointer_cast<const LayoutableShadowNode>(viewShadowNodeChildClone);
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
