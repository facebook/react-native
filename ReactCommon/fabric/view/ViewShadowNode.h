/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/view/AccessibleShadowNode.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/YogaLayoutableShadowNode.h>

namespace facebook {
namespace react {

class ViewShadowNode;

using SharedViewShadowNode = std::shared_ptr<const ViewShadowNode>;

class ViewShadowNode:
  public ConcreteShadowNode<ViewProps>,
  public AccessibleShadowNode,
  public YogaLayoutableShadowNode {

  static_assert(std::is_base_of<YogaStylableProps, ViewProps>::value, "ViewProps must be a descendant of YogaStylableProps");
  static_assert(std::is_base_of<AccessibilityProps, ViewProps>::value, "ViewProps must be a descendant of AccessibilityProps");

public:
  ViewShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const InstanceHandle &instanceHandle,
    const SharedViewProps &props = ViewShadowNode::defaultSharedProps(),
    const SharedShadowNodeSharedList &children = ShadowNode::emptySharedShadowNodeSharedList()
  );

  ViewShadowNode(
    const SharedViewShadowNode &shadowNode,
    const SharedViewProps &props = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  );

  ComponentName getComponentName() const override;

  void appendChild(const SharedShadowNode &child);

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

private:

#pragma mark - LayoutableShadowNode

  SharedLayoutableShadowNodeList getChildren() const override;
};

} // namespace react
} // namespace facebook
