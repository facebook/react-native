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
    traits.set(ShadowNodeTraits::Trait::TextKind);

#ifdef ANDROID
    // Unsetting `FormsStackingContext` trait is essential on Android where we
    // can't mount views inside `TextView`.
    traits.unset(ShadowNodeTraits::Trait::FormsStackingContext);
#endif

    return traits;
  }

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;

  /*
   * Internal representation of the nested content of the node in a format
   * suitable for future processing.
   */
  class Content final {
   public:
    AttributedString attributedString;
    ParagraphAttributes paragraphAttributes;
    Attachments attachments;
  };

 private:
  /*
   * Builds (if needed) and returns a reference to a `Content` object.
   */
  Content const &getContent(LayoutContext const &layoutContext) const;

  /*
   * Builds and returns a `Content` object with given `layoutConstraints`.
   */
  Content getContentWithMeasuredAttachments(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded(Content const &content);

  SharedTextLayoutManager textLayoutManager_;

  /*
   * Cached content of the subtree started from the node.
   */
  mutable better::optional<Content> content_{};
};

} // namespace react
} // namespace facebook
