/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ShadowNode.h>
#include <react/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

enum class DifferentiatorMode { Classic, OptimizedMoves };

/*
 * Calculates a list of view mutations which describes how the old
 * `ShadowTree` can be transformed to the new one.
 * The list of mutations might be and might not be optimal.
 */
ShadowViewMutationList calculateShadowViewMutations(
    DifferentiatorMode differentiatorMode,
    ShadowNode const &oldRootShadowNode,
    ShadowNode const &newRootShadowNode);

/*
 * Generates a list of `ShadowViewNodePair`s that represents a layer of a
 * flattened view hierarchy.
 */
ShadowViewNodePair::List sliceChildShadowNodeViewPairs(
    ShadowNode const &shadowNode);

} // namespace react
} // namespace facebook
