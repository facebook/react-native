/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/view/ViewProps.h>
#include <fabric/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

class ViewShadowNode;

using SharedViewShadowNode = std::shared_ptr<const ViewShadowNode>;

class ViewShadowNode final:
  public ConcreteViewShadowNode<ViewProps, ViewEventHandlers> {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ComponentName getComponentName() const override;
};

} // namespace react
} // namespace facebook
