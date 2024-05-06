/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidDrawerLayoutShadowNode.h"

#include <react/renderer/components/drawerlayout/AndroidDrawerLayoutShadowNode.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

extern const char AndroidDrawerLayoutComponentName[] = "AndroidDrawerLayout";

Point AndroidDrawerLayoutShadowNode::getContentOriginOffset() const {
  const auto& stateData = getStateData();

  if (stateData.drawerOpened && stateData.drawerOnLeft) {
    return {0, 0};
  } else if (stateData.drawerOpened && !stateData.drawerOnLeft) {
    return {stateData.containerWidth - stateData.drawerWidth, 0};
  }

  return {stateData.drawerOnLeft ? -stateData.containerWidth : stateData.containerWidth, 0};
}

} // namespace facebook::react
