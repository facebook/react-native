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
            flavor) {
    // Every single `AndroidTextInputShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer);
  }

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<AndroidTextInputShadowNode>(shadowNode));
    auto textInputShadowNode =
        std::static_pointer_cast<AndroidTextInputShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode->setTextLayoutManager(textLayoutManager_);

    textInputShadowNode->setContextContainer(
        const_cast<ContextContainer *>(getContextContainer().get()));

    textInputShadowNode->dirtyLayout();
    textInputShadowNode->enableMeasurement();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
};

} // namespace react
} // namespace facebook
