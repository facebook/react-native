/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutableShadowNode.h"

#include <fabric/core/LayoutConstraints.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/core/LayoutMetrics.h>

namespace facebook {
namespace react {

LayoutMetrics LayoutableShadowNode::getLayoutMetrics() const {
  return layoutMetrics_;
}

bool LayoutableShadowNode::setLayoutMetrics(LayoutMetrics layoutMetrics) {
  layoutMetrics_ = layoutMetrics;
  return true;
}

void LayoutableShadowNode::cleanLayout() {
  isLayoutClean_ = true;
}

void LayoutableShadowNode::dirtyLayout() {
  isLayoutClean_ = false;
}

bool LayoutableShadowNode::getIsLayoutClean() const {
  return isLayoutClean_;
}

bool LayoutableShadowNode::getHasNewLayout() const {
  return hasNewLayout_;
};

void LayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  hasNewLayout_ = hasNewLayout;
}

Size LayoutableShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return Size();
}

Float LayoutableShadowNode::firstBaseline(Size size) const {
  return 0;
}

Float LayoutableShadowNode::lastBaseline(Size size) const {
  return 0;
}

void LayoutableShadowNode::layout(LayoutContext layoutContext) {
  ensureUnsealed();

  layoutChildren(layoutContext);

  for (auto child : getChildren()) {
    if (!child->getHasNewLayout()) {
      continue;
    }

    // The assumption:
    // All `sealed` children were replaced with not-yet-sealed clones
    // somewhere in `layoutChildren`.
    auto nonConstChild = std::const_pointer_cast<LayoutableShadowNode>(child);

    nonConstChild->setHasNewLayout(false);

    const LayoutMetrics childLayoutMetrics = nonConstChild->getLayoutMetrics();
    if (childLayoutMetrics.displayType == None) {
      continue;
    }

    LayoutContext childLayoutContext = LayoutContext(layoutContext);
    childLayoutContext.absolutePosition += childLayoutMetrics.frame.origin;

    nonConstChild->layout(layoutContext);
  }
}

void LayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  ensureUnsealed();
  // Default implementation does nothing.
}

SharedLayoutableShadowNode LayoutableShadowNode::cloneAndReplaceChild(const SharedLayoutableShadowNode &child) {
  return child;
}

} // namespace react
} // namespace facebook
