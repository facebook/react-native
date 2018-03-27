/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ShadowNode.h>
#include <fabric/view/AccessibilityProps.h>

namespace facebook {
namespace react {

class AccessibleShadowNode;

typedef std::shared_ptr<const AccessibleShadowNode> SharedAccessibleShadowNode;

class AccessibleShadowNode {

public:

#pragma mark - Constructors

  AccessibleShadowNode() = default;

  AccessibleShadowNode(
    const SharedAccessibilityProps &props
  );

  AccessibleShadowNode(
    const SharedAccessibleShadowNode &shadowNode,
    const SharedAccessibilityProps &props = nullptr
  );
};

} // namespace react
} // namespace facebook
