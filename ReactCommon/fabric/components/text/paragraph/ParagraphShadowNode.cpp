/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"

#include <react/attributedstring/AttributedStringBox.h>
#include "ParagraphState.h"

namespace facebook {
namespace react {

char const ParagraphComponentName[] = "Paragraph";

AttributedString ParagraphShadowNode::getAttributedString(Float fontSizeMultiplier) const {
  if (!cachedAttributedString_.has_value()) {
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.fontSizeMultiplier = fontSizeMultiplier;
    textAttributes.apply(getConcreteProps().textAttributes);

    cachedAttributedString_ =
        BaseTextShadowNode::getAttributedString(textAttributes, *this);
  }

  return cachedAttributedString_.value();
}

void ParagraphShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void ParagraphShadowNode::updateStateIfNeeded(LayoutContext layoutContext) {
  ensureUnsealed();

  auto attributedString = getAttributedString(layoutContext.fontSizeMultiplier);
  auto const &state = getStateData();

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.attributedString == attributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  setStateData(ParagraphState{attributedString,
                              getConcreteProps().paragraphAttributes,
                              textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measureContent(LayoutConstraints layoutConstraints, LayoutContext layoutContext) const {
  AttributedString attributedString = getAttributedString(layoutContext.fontSizeMultiplier);

  if (attributedString.isEmpty()) {
    return layoutConstraints.clamp({0, 0});
  }

  return textLayoutManager_->measure(
      AttributedStringBox{attributedString},
      getConcreteProps().paragraphAttributes,
      layoutConstraints);
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded(layoutContext);
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
