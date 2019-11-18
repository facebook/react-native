/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <react/components/text/ParagraphProps.h>
#include <react/components/text/ParagraphState.h>
#include <react/components/text/TextShadowNode.h>
#include <react/components/view/ConcreteViewShadowNode.h>
#include <react/core/ConcreteShadowNode.h>
#include <react/core/LayoutContext.h>
#include <react/core/ShadowNode.h>
#include <react/textlayoutmanager/TextLayoutManager.h>

namespace facebook {
namespace react {

extern char const ParagraphComponentName[];

using ParagraphEventEmitter = ViewEventEmitter;

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode : public ConcreteViewShadowNode<
                                ParagraphComponentName,
                                ParagraphProps,
                                ParagraphEventEmitter,
                                ParagraphState>,
                            public BaseTextShadowNode {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measure(LayoutConstraints layoutConstraints) const override;

 private:
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
  mutable folly::Optional<AttributedString> cachedAttributedString_{};
};

} // namespace react
} // namespace facebook
