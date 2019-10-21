/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/components/root/RootProps.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/core/LayoutContext.h>

namespace facebook {
namespace react {

class RootShadowNode;

extern const char RootComponentName[];

/*
 * `ShadowNode` for the root component.
 * Besides all functionality of the `View` component, `RootShadowNode` contains
 * props which represent external layout constraints and context of the
 * shadow tree.
 */
class RootShadowNode final
    : public ConcreteViewShadowNode<RootComponentName, RootProps> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  using Shared = std::shared_ptr<RootShadowNode const>;
  using Unshared = std::shared_ptr<RootShadowNode>;

  /*
   * Layouts the shadow tree.
   */
  void layout(std::vector<LayoutableShadowNode const *> *affectedNodes = {});

  /*
   * Clones the node with given `layoutConstraints` and `layoutContext`.
   */
  RootShadowNode::Unshared clone(
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const;

  /*
   * Clones the node replacing a given old shadow node with a new one in the
   * tree by cloning all nodes on the path to the root node and then complete
   * the tree. Returns `nullptr` if the operation cannot be finished
   * successfully.
   */
  RootShadowNode::Unshared clone(
      ShadowNode const &oldShadowNode,
      ShadowNode::Shared const &newShadowNode) const;

 private:
  using YogaLayoutableShadowNode::layout;
};

} // namespace react
} // namespace facebook
