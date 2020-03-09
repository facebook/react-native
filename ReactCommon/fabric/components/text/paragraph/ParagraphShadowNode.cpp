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

ParagraphShadowNode::Content const &ParagraphShadowNode::getContent() const {
  if (content_.has_value()) {
    return content_.value();
  }

  ensureUnsealed();

  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.apply(getConcreteProps().textAttributes);

  auto attributedString = AttributedString{};
  auto attachments = Attachments{};
  buildAttributedString(textAttributes, *this, attributedString, attachments);

  content_ = Content{
      attributedString, getConcreteProps().paragraphAttributes, attachments};

  return content_.value();
}

void ParagraphShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void ParagraphShadowNode::updateStateIfNeeded(Content const &content) {
  ensureUnsealed();

  auto &state = getStateData();

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.attributedString == content.attributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  setStateData(ParagraphState{content.attributedString,
                              content.paragraphAttributes,
                              textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measure(LayoutConstraints layoutConstraints) const {
  auto content = getContent();

  if (content.attributedString.isEmpty()) {
    return layoutConstraints.clamp({0, 0});
  }

  return textLayoutManager_
      ->measure(
          AttributedStringBox{content.attributedString},
          content.paragraphAttributes,
          layoutConstraints)
      .size;
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded(getContent());
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
