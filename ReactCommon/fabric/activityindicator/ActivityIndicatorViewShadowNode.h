/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/activityindicator/ActivityIndicatorViewProps.h>
#include <fabric/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

/*
 * `ShadowNode` for <ActivityIndicatorView> component.
 */
class ActivityIndicatorViewShadowNode final:
  public ConcreteViewShadowNode<ActivityIndicatorViewProps> {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ComponentName getComponentName() const override;
};

} // namespace react
} // namespace facebook
