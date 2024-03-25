/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidSwitchShadowNode.h"

namespace facebook::react {

extern const char AndroidSwitchComponentName[] = "AndroidSwitch";

void AndroidSwitchShadowNode::setAndroidSwitchMeasurementsManager(
    const std::shared_ptr<AndroidSwitchMeasurementsManager>&
        measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

#pragma mark - LayoutableShadowNode

Size AndroidSwitchShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
  return measurementsManager_->measure(getSurfaceId(), layoutConstraints);
}

} // namespace facebook::react
