/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootShadowNode.h"

#include <react/components/view/conversions.h>

namespace facebook {
namespace react {

const char RootComponentName[] = "RootView";

void RootShadowNode::layout() {
  ensureUnsealed();
  layout(getProps()->layoutContext);

  // This is the rare place where shadow node must layout (set `layoutMetrics`)
  // itself because there is no a parent node which usually should do it.
  setLayoutMetrics(layoutMetricsFromYogaNode(yogaNode_));
}

} // namespace react
} // namespace facebook
