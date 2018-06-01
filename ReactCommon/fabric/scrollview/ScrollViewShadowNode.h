/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/LayoutContext.h>
#include <fabric/scrollview/ScrollViewEventHandlers.h>
#include <fabric/scrollview/ScrollViewProps.h>
#include <fabric/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

class ScrollViewShadowNode;

using SharedScrollViewShadowNode = std::shared_ptr<const ScrollViewShadowNode>;

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final:
  public ConcreteViewShadowNode<ScrollViewProps, ScrollViewEventHandlers> {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ComponentName getComponentName() const override;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

private:

  void updateLocalData();
};

} // namespace react
} // namespace facebook
