/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibleShadowNode.h"

#include <memory>

namespace facebook {
namespace react {

AccessibleShadowNode::AccessibleShadowNode(
    const SharedAccessibilityProps &props) {
  assert(props);
}

AccessibleShadowNode::AccessibleShadowNode(
    const AccessibleShadowNode &shadowNode,
    const SharedAccessibilityProps &props) {}

} // namespace react
} // namespace facebook
