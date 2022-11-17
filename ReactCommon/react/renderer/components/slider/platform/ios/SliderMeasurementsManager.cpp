/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SliderMeasurementsManager.h"

#include <react/debug/react_native_assert.h>

namespace facebook {
namespace react {

Size SliderMeasurementsManager::measure(
    SurfaceId surfaceId,
    LayoutConstraints layoutConstraints) const {
  react_native_assert(false); // should never reach this point
  return {};
}

} // namespace react
} // namespace facebook
