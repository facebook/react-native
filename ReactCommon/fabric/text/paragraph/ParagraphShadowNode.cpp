/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

#import "ParagraphLocalData.h"

namespace facebook {
namespace react {

ComponentName ParagraphShadowNode::getComponentName() const {
  return ComponentName("Paragraph");
}

AttributedString ParagraphShadowNode::getAttributedString() const {
  return BaseTextShadowNode::getAttributedString(getProps()->textAttributes, getChildren());
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
  ConcreteViewShadowNode<ParagraphProps>::layout(layoutContext);
}

} // namespace react
} // namespace facebook
