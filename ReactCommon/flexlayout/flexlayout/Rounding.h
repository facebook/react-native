/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlexLayoutMacros.h"

namespace facebook {
namespace flexlayout {
namespace algo {

FLEX_LAYOUT_EXPORT auto RoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor) -> float;

} // namespace algo
} // namespace flexlayout
} // namespace facebook
