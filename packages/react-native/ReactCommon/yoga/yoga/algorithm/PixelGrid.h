/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

// Round a point value to the nearest physical pixel based on DPI
// (pointScaleFactor)
float roundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

// Round the layout results of a node and its subtree to the pixel grid.
void roundLayoutResultsToPixelGrid(
    yoga::Node* const node,
    const double absoluteLeft,
    const double absoluteTop);

} // namespace facebook::yoga
