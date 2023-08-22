/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/inputaccessory/InputAccessoryShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <InputAccessoryView> component.
 */
class InputAccessoryComponentDescriptor final
    : public ConcreteComponentDescriptor<InputAccessoryShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    auto concreteShadowNode =
        std::static_pointer_cast<InputAccessoryShadowNode>(shadowNode);

    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(concreteShadowNode);

    auto state =
        std::static_pointer_cast<const InputAccessoryShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    layoutableShadowNode->setSize(
        Size{stateData.viewportSize.width, stateData.viewportSize.height});
    layoutableShadowNode->setPositionType(YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace react
} // namespace facebook
