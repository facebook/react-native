/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>

namespace facebook::react {

/*
 * TextLayoutContext: Additional contextual information useful for text
 * measurement.
 */
struct TextLayoutContext {
  /*
   * Reflects the scale factor needed to convert from the logical coordinate
   * space into the device coordinate space of the physical screen.
   * Some layout systems *might* use this to round layout metric values
   * to `pixel value`.
   */
  Float pointScaleFactor{1.0};
};

inline bool operator==(
    const TextLayoutContext& lhs,
    const TextLayoutContext& rhs) {
  return std::tie(lhs.pointScaleFactor) == std::tie(rhs.pointScaleFactor);
}

inline bool operator!=(
    const TextLayoutContext& lhs,
    const TextLayoutContext& rhs) {
  return !(lhs == rhs);
}

} // namespace facebook::react
