/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ConcreteComponentDescriptor.h>
#include <react/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

class AndroidSwitchMeasurementsManager {
 public:
  AndroidSwitchMeasurementsManager(
      const ContextContainer::Shared &contextContainer)
      : contextContainer_(contextContainer) {}

  Size measure(SurfaceId surfaceId, LayoutConstraints layoutConstraints) const;

 private:
  const ContextContainer::Shared contextContainer_;
  mutable std::mutex mutex_;
  mutable bool hasBeenMeasured_ = false;
  mutable Size cachedMeasurement_{};
};

} // namespace react
} // namespace facebook
