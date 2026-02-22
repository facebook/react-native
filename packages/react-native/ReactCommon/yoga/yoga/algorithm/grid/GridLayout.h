/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/algorithm/grid/AutoPlacement.h>
#include <yoga/event/event.h>
#include <yoga/node/Node.h>
#include <vector>

namespace facebook::yoga {

void calculateGridLayoutInternal(
    yoga::Node* node,
    float availableWidth,
    float availableHeight,
    Direction ownerDirection,
    SizingMode widthSizingMode,
    SizingMode heightSizingMode,
    float ownerWidth,
    float ownerHeight,
    bool performLayout,
    LayoutPassReason reason,
    LayoutData& layoutMarkerData,
    uint32_t depth,
    uint32_t generationCount);

struct GridTracks {
  std::vector<GridTrackSize> columnTracks;
  std::vector<GridTrackSize> rowTracks;
};
// Creates implicit grid tracks based on the auto placement result
GridTracks createGridTracks(
    yoga::Node* node,
    const ResolvedAutoPlacement& autoPlacement);

} // namespace facebook::yoga
