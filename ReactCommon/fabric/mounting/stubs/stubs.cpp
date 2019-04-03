// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "stubs.h"

#include <react/core/LayoutableShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/mounting/Differentiator.h>

namespace facebook {
namespace react {

StubViewTree stubViewTreeFromShadowNode(ShadowNode const &rootShadowNode) {
  auto emptyRootShadowNode = rootShadowNode.clone(
      ShadowNodeFragment{ShadowNodeFragment::tagPlaceholder(),
                         ShadowNodeFragment::surfaceIdPlaceholder(),
                         ShadowNodeFragment::propsPlaceholder(),
                         ShadowNodeFragment::eventEmitterPlaceholder(),
                         ShadowNode::emptySharedShadowNodeSharedList()});

  auto stubViewTree = StubViewTree(ShadowView(*emptyRootShadowNode));
  stubViewTree.mutate(
      calculateShadowViewMutations(*emptyRootShadowNode, rootShadowNode));
  return stubViewTree;
}

} // namespace react
} // namespace facebook
