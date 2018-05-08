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
  
SharedTextShadowNode ParagraphShadowNode::getTextChildNode() const {
  // <Paragraph> component must always have a single <Text> child component.
  assert(getChildren()->size() == 1);
  auto childNode = getChildren()->front();
  assert(std::dynamic_pointer_cast<const TextShadowNode>(childNode));
  return std::static_pointer_cast<const TextShadowNode>(childNode);
}

AttributedString ParagraphShadowNode::getAttributedString() const {
  return getTextChildNode()->getAttributedString(TextAttributes());
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
    getProps()->getParagraphAttributes(),
    layoutConstraints
  );
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateLocalData();
  ConcreteViewShadowNode<ParagraphProps>::layout(layoutContext);
}

} // namespace react
} // namespace facebook
