/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_set>

#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * LayoutContext: Additional contextual information useful for particular
 * layout approaches.
 */
struct LayoutContext {
  /*
   * Compound absolute position of the node relative to the root node.
   */
  Point absolutePosition {0, 0};

  /*
   * Collection of shadow nodes which were chanded during the layout pass,
   * and which associated views might need to be updated.
   */
  std::shared_ptr<std::unordered_set<SharedLayoutableShadowNode>> affectedShadowNodes {nullptr};
};

} // namespace react
} // namespace facebook
