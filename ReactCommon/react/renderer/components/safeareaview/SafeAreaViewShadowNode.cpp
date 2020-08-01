/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SafeAreaViewShadowNode.h"

namespace facebook {
namespace react {

extern const char SafeAreaViewComponentName[] = "SafeAreaView";

SafeAreaViewShadowNode::SafeAreaViewShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment),
      alreadyAppliedPadding(
          static_cast<SafeAreaViewShadowNode const &>(sourceShadowNode)
              .alreadyAppliedPadding) {}

} // namespace react
} // namespace facebook
