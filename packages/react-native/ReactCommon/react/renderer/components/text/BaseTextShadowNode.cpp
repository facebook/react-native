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

void BaseTextShadowNode::buildAttributedString(
    const TextAttributes& baseTextAttributes,
    const ShadowNode& parentNode,
    AttributedString& outAttributedString,
    Attachments& outAttachments) {
  for (const auto& childNode : parentNode.getChildren()) {
    // RawShadowNode
    auto rawTextShadowNode =
        dynamic_cast<const RawTextShadowNode*>(childNode.get());
    if (rawTextShadowNode != nullptr) {
      auto textFragment = AttributedString::TextFragment{};
      const auto& text = rawTextShadowNode->getConcreteProps().text;

      if (!text.empty()) {
        textFragment.string = text;
        textFragment.textAttributes = baseTextAttributes;

        // Storing a retaining pointer to `ParagraphShadowNode` inside
        // `attributedString` causes a retain cycle (besides that fact that we
        // don't need it at all). Storing a `ShadowView` instance instead of
        // `ShadowNode` should properly fix this problem.
        textFragment.parentShadowView = shadowViewFromShadowNode(parentNode);

        outAttributedString.appendTextFragment(fragment);
      }

      continue;
    }

    // TextShadowNode
    auto textShadowNode = dynamic_cast<const TextShadowNode*>(childNode.get());
    if (textShadowNode != nullptr) {
      auto localTextAttributes = baseTextAttributes;
      localTextAttributes.apply(
          textShadowNode->getConcreteProps().textAttributes);
      buildAttributedString(
          localTextAttributes,
          *textShadowNode,
          outAttributedString,
          outAttachments);
      continue;
    }

    // Any *other* kind of ShadowNode
    auto textFragment = AttributedString::TextFragment{};
    textFragment.string = AttributedString::TextFragment::AttachmentCharacter();
    textFragment.parentShadowView = shadowViewFromShadowNode(*childNode);
    textFragment.textAttributes = baseTextAttributes;

    auto fragmentHandle = outAttributedString.appendTextFragment(textFragment);
    outAttachments.push_back(Attachment{childNode.get(), fragmentHandle});
  }
}

} // namespace facebook::react
