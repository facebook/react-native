/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputShadowNode.h"

namespace facebook::react {

extern const char AndroidTextInputComponentName[] = "AndroidTextInput";

Size AndroidTextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto textConstraints = getTextConstraints(layoutConstraints);

  if (getStateData().cachedAttributedStringId != 0) {
    auto textSize = textLayoutManager_
                        ->measureCachedSpannableById(
                            getStateData().cachedAttributedStringId,
                            getConcreteProps().paragraphAttributes,
                            textConstraints)
                        .size;
    return layoutConstraints.clamp(textSize);
  }
  return BaseTextInputShadowNode::measureContent(
      layoutContext, layoutConstraints);
}

} // namespace facebook::react
