/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/LayoutContext.h>
#include <fabric/view/RootProps.h>
#include <fabric/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

class RootShadowNode;

using SharedRootShadowNode = std::shared_ptr<const RootShadowNode>;
using UnsharedRootShadowNode = std::shared_ptr<RootShadowNode>;

/*
 * `ShadowNode` for the root component.
 * Besides all functionality of the `View` component, `RootShadowNode` contains
 * props which represent external layout constraints and context of the
 * shadow tree.
 */
class RootShadowNode final:
  public ConcreteViewShadowNode<RootProps> {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ComponentName getComponentName() const override;

  /*
   * Layouts the shadow tree.
   */
  void layout();

private:

  using YogaLayoutableShadowNode::layout;
};

} // namespace react
} // namespace facebook
