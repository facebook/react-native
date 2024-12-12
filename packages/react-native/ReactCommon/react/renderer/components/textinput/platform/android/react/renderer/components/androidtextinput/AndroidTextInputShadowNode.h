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
          /* usesMapBufferForStateData */ true> {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::BaselineYogaNode);
    return traits;
  }

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;
  AttributedString getPlaceholderAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<const TextLayoutManager> textLayoutManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

  Float baseline(const LayoutContext& layoutContext, Size size) const override;

 private:
  /**
   * Get the most up-to-date attributed string for measurement and State.
   */
  AttributedString getMostRecentAttributedString() const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded();

  std::shared_ptr<const TextLayoutManager> textLayoutManager_;
};

} // namespace facebook::react
