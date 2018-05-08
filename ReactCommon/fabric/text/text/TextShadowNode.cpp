/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextShadowNode.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

#include "RawTextShadowNode.h"
#include "RawTextProps.h"

namespace facebook {
namespace react {

ComponentName TextShadowNode::getComponentName() const {
  return ComponentName("Text");
}

AttributedString TextShadowNode::getAttributedString(const TextAttributes &baseTextAttributes) const {
  // TODO: Implement caching.

  TextAttributes textAttributes = baseTextAttributes;
  textAttributes.apply(getProps()->getTextAttributes());

  AttributedString attributedString;

  for (auto &&childNode : *getChildren()) {
    // RawShadowNode
    SharedRawTextShadowNode rawTextShadowNode = std::dynamic_pointer_cast<const RawTextShadowNode>(childNode);
    if (rawTextShadowNode) {
      AttributedString::Fragment fragment;
      fragment.string = rawTextShadowNode->getProps()->getText();
      fragment.textAttributes = textAttributes;
      attributedString.appendFragment(fragment);
      continue;
    }

    // TextShadowNode
    SharedTextShadowNode textShadowNode = std::dynamic_pointer_cast<const TextShadowNode>(childNode);
    if (textShadowNode) {
      attributedString.appendAttributedString(textShadowNode->getAttributedString(textAttributes));
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
