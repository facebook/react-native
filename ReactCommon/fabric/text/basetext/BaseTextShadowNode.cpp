/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextShadowNode.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

#include "RawTextShadowNode.h"
#include "RawTextProps.h"
#include "TextShadowNode.h"
#include "TextProps.h"

namespace facebook {
namespace react {

AttributedString BaseTextShadowNode::getAttributedString(
  const TextAttributes &textAttributes,
  const SharedShadowNodeSharedList &childNodes
) const {
  // TODO: Implement caching.

  AttributedString attributedString;

  for (auto &&childNode : *childNodes) {
    // RawShadowNode
    SharedRawTextShadowNode rawTextShadowNode = std::dynamic_pointer_cast<const RawTextShadowNode>(childNode);
    if (rawTextShadowNode) {
      AttributedString::Fragment fragment;
      fragment.string = rawTextShadowNode->getProps()->text;
      fragment.textAttributes = textAttributes;
      attributedString.appendFragment(fragment);
      continue;
    }

    // TextShadowNode
    SharedTextShadowNode textShadowNode = std::dynamic_pointer_cast<const TextShadowNode>(childNode);
    if (textShadowNode) {
      TextAttributes localTextAttributes = textAttributes;
      localTextAttributes.apply(textShadowNode->getProps()->textAttributes);
      attributedString.appendAttributedString(textShadowNode->getAttributedString(localTextAttributes, textShadowNode->getChildren()));
      continue;
    }

    // Any other kind of ShadowNode
    AttributedString::Fragment fragment;
    fragment.shadowNode = childNode;
    fragment.textAttributes = textAttributes;
    attributedString.appendFragment(fragment);
  }

  return attributedString;
}

} // namespace react
} // namespace facebook
