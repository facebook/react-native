/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/event/event.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

void layoutAbsoluteChild(
    const yoga::Node* containingNode,
    const yoga::Node* node,
    yoga::Node* child,
    float containingBlockWidth,
    float containingBlockHeight,
    SizingMode widthMode,
    Direction direction,
    LayoutData& layoutMarkerData,
    uint32_t depth,
    uint32_t generationCount);

void layoutAbsoluteDescendants(
    yoga::Node* containingNode,
    yoga::Node* currentNode,
    SizingMode widthSizingMode,
    Direction currentNodeDirection,
    LayoutData& layoutMarkerData,
    uint32_t currentDepth,
    uint32_t generationCount,
    float currentNodeMainOffsetFromContainingBlock,
    float currentNodeCrossOffsetFromContainingBlock,
    float containingNodeAvailableInnerWidth,
    float containingNodeAvailableInnerHeight);

} // namespace facebook::yoga
