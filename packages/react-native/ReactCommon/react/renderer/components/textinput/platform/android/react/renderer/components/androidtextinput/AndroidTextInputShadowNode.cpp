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

void AndroidTextInputShadowNode::updateStateIfNeeded(
    const LayoutContext& layoutContext) {
  Sealable::ensureUnsealed();
  const auto& stateData = BaseShadowNode::getStateData();
  const auto& reactTreeAttributedString = getAttributedString(layoutContext);

  // Tree is often out of sync with the value of the TextInput.
  // This is by design - don't change the value of the TextInput in the State,
  // and therefore in Java, unless the tree itself changes.
  if (stateData.reactTreeAttributedString == reactTreeAttributedString) {
    return;
  }

  // If props event counter is less than what we already have in state, skip it
  const auto& props = BaseShadowNode::getConcreteProps();
  if (props.mostRecentEventCount < stateData.mostRecentEventCount) {
    return;
  }

  // Even if we're here and updating state, it may be only to update the layout
  // manager If that is the case, make sure we don't update text: pass in the
  // current attributedString unchanged, and pass in zero for the "event count"
  // so no changes are applied There's no way to prevent a state update from
  // flowing to Java, so we just ensure it's a noop in those cases.
  auto newEventCount = stateData.reactTreeAttributedString.isContentEqual(
                           reactTreeAttributedString)
      ? 0
      : props.mostRecentEventCount;

  BaseShadowNode::setStateData(TextInputState{
      AttributedStringBox{reactTreeAttributedString},
      reactTreeAttributedString,
      props.paragraphAttributes,
      newEventCount});
}

} // namespace facebook::react
