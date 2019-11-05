/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ConcreteComponentDescriptor.h>
#include "AndroidTextInputShadowNode.h"

namespace facebook {
namespace react {

/*
 * Descriptor for <AndroidTextInput> component.
 */
class AndroidTextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidTextInputShadowNode> {
 public:
  AndroidTextInputComponentDescriptor(
      EventDispatcher::Weak eventDispatcher,
      const ContextContainer::Shared &contextContainer,
      ComponentDescriptor::Flavor const &flavor = {})
      : ConcreteComponentDescriptor<AndroidTextInputShadowNode>(
            eventDispatcher,
            contextContainer,
            flavor) {}

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<AndroidTextInputShadowNode>(shadowNode));
    auto concreteShadowNode =
        std::static_pointer_cast<AndroidTextInputShadowNode>(shadowNode);

    concreteShadowNode->setContextContainer(
        const_cast<ContextContainer *>(getContextContainer().get()));

    concreteShadowNode->dirtyLayout();
    concreteShadowNode->enableMeasurement();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace react
} // namespace facebook
