/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextShadowNode.h"

#include <react/renderer/components/text/RawTextProps.h>
#include <react/renderer/components/text/RawTextShadowNode.h>
#include <react/renderer/components/text/TextProps.h>
#include <react/renderer/components/text/TextShadowNode.h>
#include <react/renderer/core/TraitCast.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

inline ShadowView shadowViewFromShadowNode(const ShadowNode& shadowNode) {
  auto shadowView = ShadowView{shadowNode};
  // Clearing `props` and `state` (which we don't use) allows avoiding retain
  // cycles.
  shadowView.props = nullptr;
  shadowView.state = nullptr;
  return shadowView;
}

void BaseTextShadowNode::buildSpanForParent(
    const TextAttributes& baseTextAttributes,
    const ShadowNode& parentNode,
    AttributedString::Span& outSpan,
    size_t outSpanIndex,
    Attachments& outAttachments) {
  for (const auto& childNode : parentNode.getChildren()) {
    buildSpanForChild(
        baseTextAttributes,
        parentNode,
        childNode,
        outSpan,
        outSpanIndex,
        outAttachments);
  }
}

void BaseTextShadowNode::buildSpanForTopLevelChild(
    const TextAttributes& baseTextAttributes,
    const ShadowNode& rootNode,
    const ShadowNode::Shared topLevelChildNode,
    AttributedString::Span& outSpan,
    size_t outSpanIndex,
    Attachments& outAttachments) {
  auto textShadowNode = traitCast<const TextShadowNode*>(topLevelChildNode.get());
  if (textShadowNode != nullptr) {
    const auto spanAttributes = textShadowNode->getConcreteProps().spanAttributes;

    outSpan.spanAttributes = spanAttributes;
  }

  buildSpanForChild(
      baseTextAttributes,
      rootNode,
      topLevelChildNode,
      outSpan,
      outSpanIndex,
      outAttachments);
}

void BaseTextShadowNode::buildSpanForChild(
    const TextAttributes& baseTextAttributes,
    const ShadowNode& parentNode,
    const ShadowNode::Shared childNode,
    AttributedString::Span& outSpan,
    size_t outSpanIndex,
    Attachments& outAttachments) {
  // RawShadowNode
  auto rawTextShadowNode = traitCast<const RawTextShadowNode*>(childNode.get());
  if (rawTextShadowNode != nullptr) {
    auto fragment = AttributedString::Fragment{};
    fragment.string = rawTextShadowNode->getConcreteProps().text;
    fragment.textAttributes = baseTextAttributes;

    // Storing a retaining pointer to `ParagraphShadowNode` inside
    // `attributedString` causes a retain cycle (besides that fact that we
    // don't need it at all). Storing a `ShadowView` instance instead of
    // `ShadowNode` should properly fix this problem.
    fragment.parentShadowView = shadowViewFromShadowNode(parentNode);
    outSpan.appendFragment(fragment);
    return;
  }

  // TextShadowNode
  auto textShadowNode = traitCast<const TextShadowNode*>(childNode.get());
  if (textShadowNode != nullptr) {
    auto localTextAttributes = baseTextAttributes;
    localTextAttributes.apply(
        textShadowNode->getConcreteProps().textAttributes);
    buildSpanForParent(
        localTextAttributes,
        *textShadowNode,
        outSpan,
        outSpanIndex,
        outAttachments);
    return;
  }

  // Any *other* kind of ShadowNode
  auto fragment = AttributedString::Fragment{};
  fragment.string = AttributedString::Fragment::AttachmentCharacter();
  fragment.parentShadowView = shadowViewFromShadowNode(*childNode);
  fragment.textAttributes = baseTextAttributes;
  outSpan.appendFragment(fragment);

  const auto fragmentIndex = outSpan.getFragments().size() - 1;
  const auto fragmentHandle =
      AttributedString::FragmentHandle{outSpanIndex, fragmentIndex};
  outAttachments.push_back(Attachment{childNode.get(), fragmentHandle});
}

void BaseTextShadowNode::buildAttributedString(
    const TextAttributes& baseTextAttributes,
    const ShadowNode& rootNode,
    AttributedString& outAttributedString,
    Attachments& outAttachments) {
  size_t spanIndex = 0;

  for (const auto& topLevelChildNode : rootNode.getChildren()) {
    auto span = AttributedString::Span{};

    buildSpanForTopLevelChild(
        baseTextAttributes,
        rootNode,
        topLevelChildNode,
        span,
        spanIndex++,
        outAttachments);

    outAttributedString.appendSpan(span);
  }
}

} // namespace facebook::react
