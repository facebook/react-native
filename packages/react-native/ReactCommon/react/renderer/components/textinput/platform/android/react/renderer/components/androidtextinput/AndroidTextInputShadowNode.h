/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputEventEmitter.h"
#include "AndroidTextInputProps.h"

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/textinput/BaseTextInputShadowNode.h>
#include <react/renderer/components/textinput/TextInputState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode final
    : public ConcreteViewShadowNode<
          AndroidTextInputComponentName,
          AndroidTextInputProps,
          AndroidTextInputEventEmitter,
          TextInputState,
          /* usesMapBufferForStateData */ true>,
      public BaseTextInputShadowNode {
 public:
  ~AndroidTextInputShadowNode() noexcept override = default;

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
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
