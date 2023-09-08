/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/progressbar/conversions.h>
#include <react/renderer/components/rncore/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class AndroidProgressBarMeasurementsManager {
 public:
  AndroidProgressBarMeasurementsManager(
      const ContextContainer::Shared& contextContainer)
      : contextContainer_(contextContainer) {}

  Size measure(
      SurfaceId surfaceId,
      const AndroidProgressBarProps& props,
      LayoutConstraints layoutConstraints) const;

 private:
  const ContextContainer::Shared contextContainer_;
  mutable std::mutex mutex_;
  mutable bool hasBeenMeasured_ = false;
  mutable Size cachedMeasurement_{};
};

} // namespace facebook::react
