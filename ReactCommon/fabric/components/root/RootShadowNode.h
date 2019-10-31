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
   * Clones the node (and partially the tree starting from the node) by
   * replacing a `oldShadowNode` (which corresponds to a given `shadowNode`)
   * with a node that `callback` returns. `oldShadowNode` might not be the same
   * as `shadowNode` but they must share the same family.
   *
   * Returns `nullptr` if the operation cannot be performed successfully.
   */
  RootShadowNode::Unshared clone(
      ShadowNode const &shadowNode,
      std::function<ShadowNode::Unshared(ShadowNode const &oldShadowNode)>
          callback) const;

 private:
  using YogaLayoutableShadowNode::layout;
};

} // namespace react
} // namespace facebook
