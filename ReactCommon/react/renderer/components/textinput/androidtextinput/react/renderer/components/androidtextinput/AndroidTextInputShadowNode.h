/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputEventEmitter.h"
#include "AndroidTextInputProps.h"
#include "AndroidTextInputState.h"

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/utils/ContextContainer.h>

#include <react/renderer/attributedstring/AttributedString.h>

namespace facebook {
namespace react {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode final : public ConcreteViewShadowNode<
                                             AndroidTextInputComponentName,
                                             AndroidTextInputProps,
                                             AndroidTextInputEventEmitter,
                                             AndroidTextInputState> {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::TextKind);
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  void setContextContainer(ContextContainer *contextContainer);

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;
  AttributedString getPlaceholderAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  ContextContainer *contextContainer_{};

  /**
   * Get the most up-to-date attributed string for measurement and State.
   */
  AttributedString getMostRecentAttributedString() const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded();

  SharedTextLayoutManager textLayoutManager_;

  /*
   * Cached attributed string that represents the content of the subtree started
   * from the node.
   */
  mutable butter::optional<AttributedString> cachedAttributedString_{};
};

} // namespace react
} // namespace facebook
