/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>

namespace facebook {
namespace react {

/**
 * Problem Description: because of C++ State, the React Native C++ ShadowTree
 * can diverge from the ReactJS ShadowTree; ReactJS communicates all tree
 * changes to C++, but C++ state commits are not propagated to ReactJS (ReactJS
 * may or may not clone nodes with state changes, but it has no way of knowing
 * if it /should/ clone those nodes; so those clones may never happen). This
 * causes a number of problems. This function resolves the problem by taking a
 * candidate tree being committed, and sees if any State changes need to be
 * applied to it. If any changes need to be made, a new ShadowNode is returned;
 * otherwise, nullptr is returned if the node is already consistent with the
 * latest tree, including all state changes.
 *
 * This should be called during the commit phase, pre-layout and pre-diff.
 */
UnsharedShadowNode reconcileStateWithTree(
    ShadowNode const *newNode,
    SharedShadowNode committedNode);

} // namespace react
} // namespace facebook
