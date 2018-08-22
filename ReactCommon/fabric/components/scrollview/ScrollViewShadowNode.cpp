/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewShadowNode.h"

#include <fabric/core/LayoutMetrics.h>

#include "ScrollViewLocalData.h"

namespace facebook {
namespace react {

const char ScrollViewComponentName[] = "ScrollView";

void ScrollViewShadowNode::updateLocalData() {
  ensureUnsealed();

  Rect contentBoundingRect;
  for (const auto &childNode : getLayoutableChildNodes()) {
    contentBoundingRect.unionInPlace(childNode->getLayoutMetrics().frame);
  }

  const auto &localData = std::make_shared<const ScrollViewLocalData>(contentBoundingRect);
  setLocalData(localData);
}

#pragma mark - LayoutableShadowNode

void ScrollViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateLocalData();
}

} // namespace react
} // namespace facebook
