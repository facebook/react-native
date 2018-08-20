/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"

#include "ParagraphLocalData.h"

namespace facebook {
namespace react {

const char ParagraphComponentName[] = "Paragraph";

AttributedString ParagraphShadowNode::getAttributedString() const {
  if (!cachedAttributedString_.has_value()) {
    cachedAttributedString_ =
      BaseTextShadowNode::getAttributedString(getProps()->textAttributes, getChildren());
  }

  return cachedAttributedString_.value();
}

void ParagraphShadowNode::setTextLayoutManager(SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void ParagraphShadowNode::updateLocalData() {
  ensureUnsealed();

  auto localData = std::make_shared<ParagraphLocalData>();
  localData->setAttributedString(getAttributedString());
  localData->setTextLayoutManager(textLayoutManager_);
  setLocalData(localData);
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return textLayoutManager_->measure(
    getAttributedString(),
    getProps()->paragraphAttributes,
    layoutConstraints
  );
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateLocalData();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
