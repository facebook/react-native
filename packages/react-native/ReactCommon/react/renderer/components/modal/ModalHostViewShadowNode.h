/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/modal/ModalHostViewState.h>
#include <react/renderer/components/rncore/EventEmitters.h>
#include <react/renderer/components/rncore/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#if defined(__APPLE__) && TARGET_OS_IOS
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/graphics/Size.h>
#endif

namespace facebook::react {

extern const char ModalHostViewComponentName[];

/*
 * `ShadowNode` for <ModalHostView> component.
 */
class ModalHostViewShadowNode final : public ConcreteViewShadowNode<
                                          ModalHostViewComponentName,
                                          ModalHostViewProps,
                                          ModalHostViewEventEmitter,
                                          ModalHostViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }

#if defined(__APPLE__) && TARGET_OS_IOS
  static ConcreteStateData initialStateData(
      const Props::Shared& /*props*/,
      const ShadowNodeFamily::Shared& /*family*/,
      const ComponentDescriptor& componentDescriptor) {
    const std::shared_ptr<const ContextContainer>& contextContainer =
        componentDescriptor.getContextContainer();
    Size screenSize = contextContainer->at<Size>("RCTScreenSize");
    return screenSize;
  }
#endif
};

} // namespace facebook::react
