/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/scrollview/ScrollViewEventEmitter.h>
#include <react/components/scrollview/ScrollViewProps.h>
#include <react/components/scrollview/ScrollViewState.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/core/LayoutContext.h>

namespace facebook {
namespace react {

extern const char ScrollViewComponentName[];

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final : public ConcreteViewShadowNode<
                                       ScrollViewComponentName,
                                       ScrollViewProps,
                                       ScrollViewEventEmitter,
                                       ScrollViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Transform getTransform() const override;

 private:
  void updateStateIfNeeded();
};

} // namespace react
} // namespace facebook
