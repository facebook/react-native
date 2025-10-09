/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidProgressBarShadowNode.h"

#include <react/renderer/components/progressbar/AndroidProgressBarShadowNode.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
extern const char AndroidProgressBarComponentName[] = "AndroidProgressBar";

void AndroidProgressBarShadowNode::setAndroidProgressBarMeasurementsManager(
    const std::shared_ptr<AndroidProgressBarMeasurementsManager>&
        measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

#pragma mark - LayoutableShadowNode

Size AndroidProgressBarShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
  return measurementsManager_->measure(
      getSurfaceId(), getConcreteProps(), layoutConstraints);
}

} // namespace facebook::react
