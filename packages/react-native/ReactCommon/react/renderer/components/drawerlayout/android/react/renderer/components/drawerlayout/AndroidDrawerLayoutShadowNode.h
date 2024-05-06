/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/drawerlayout/AndroidDrawerLayoutState.h>
#include <react/renderer/components/rncore/EventEmitters.h>
#include <react/renderer/components/rncore/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char AndroidDrawerLayoutComponentName[];

/*
 * `ShadowNode` for <AndroidDrawerLayout> component.
 */
class AndroidDrawerLayoutShadowNode final : public ConcreteViewShadowNode<
                                               AndroidDrawerLayoutComponentName,
                                               AndroidDrawerLayoutProps,
                                               AndroidDrawerLayoutEventEmitter,
                                               AndroidDrawerLayoutState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  Point getContentOriginOffset() const override;

};

} // namespace facebook::react
