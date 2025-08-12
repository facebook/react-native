/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char IOSSwitchComponentName[];

// iOS Switch size is a constant, depending on the iOS version
static Size iosSwitchSize{};

/*
 * `ShadowNode` for <IOSSwitch> component.
 */
class SwitchShadowNode final : public ConcreteViewShadowNode<
                                   IOSSwitchComponentName,
                                   SwitchProps,
                                   SwitchEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

#pragma mark - LayoutableShadowNode

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
