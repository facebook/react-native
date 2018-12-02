/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/components/view/AccessibilityProps.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

class AccessibleShadowNode;

using SharedAccessibleShadowNode = std::shared_ptr<const AccessibleShadowNode>;

class AccessibleShadowNode {
 public:
#pragma mark - Constructors

  AccessibleShadowNode() = default;

  AccessibleShadowNode(const SharedAccessibilityProps &props);

  AccessibleShadowNode(
      const AccessibleShadowNode &shadowNode,
      const SharedAccessibilityProps &props = nullptr);
};

} // namespace react
} // namespace facebook
