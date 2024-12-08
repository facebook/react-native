/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputShadowNode.h"

namespace facebook::react {

extern const char TextInputComponentName[] = "TextInput";

Size TextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  return BaseTextInputShadowNode::measureContent(
      layoutContext, layoutConstraints, getConcreteProps(), getStateData());
}

Float TextInputShadowNode::baseline(
    const LayoutContext& layoutContext,
    Size size) const {
  return BaseTextInputShadowNode::baseline(
      layoutContext, size, getConcreteProps(), yogaNode_);
}

void TextInputShadowNode::layout(LayoutContext layoutContext) {
  if (auto state = BaseTextInputShadowNode::updateStateIfNeeded(
          layoutContext, getConcreteProps(), getStateData());
      state.has_value()) {
    setStateData(std::move(state.value()));
  }
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace facebook::react
