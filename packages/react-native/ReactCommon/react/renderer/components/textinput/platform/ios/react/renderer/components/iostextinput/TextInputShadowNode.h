/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iostextinput/TextInputProps.h>
#include <react/renderer/components/textinput/BaseTextInputShadowNode.h>
#include <react/renderer/components/textinput/TextInputEventEmitter.h>
#include <react/renderer/components/textinput/TextInputState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char TextInputComponentName[];

/*
 * `ShadowNode` for <TextInput> component.
 */
class TextInputShadowNode final : public ConcreteViewShadowNode<
                                      TextInputComponentName,
                                      TextInputProps,
                                      TextInputEventEmitter,
                                      TextInputState>,
                                  public BaseTextInputShadowNode {
 public:
  ~TextInputShadowNode() noexcept override = default;

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    traits.set(ShadowNodeTraits::Trait::BaselineYogaNode);
    return traits;
  }

  bool hasMeaningfulState() const override {
    return getState() &&
        getState()->getRevision() != State::initialRevisionValue;
  }

  const ShadowNode& getShadowNode() const override {
    return *this;
  }

  void ensureUnsealed() const override {
    Sealable::ensureUnsealed();
  }

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

  void layout(LayoutContext layoutContext) override;

  Float baseline(const LayoutContext& layoutContext, Size size) const override;
};

} // namespace facebook::react
