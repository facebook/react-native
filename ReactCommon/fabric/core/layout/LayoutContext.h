/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <react/core/LayoutableShadowNode.h>
#include <react/graphics/Geometry.h>

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
  Point absolutePosition{0, 0};

  /*
   * Reflects the scale factor needed to convert from the logical coordinate
   * space into the device coordinate space of the physical screen.
   * Some layout systems *might* use this to round layout metric values
   * to `pixel value`.
   */
  Float pointScaleFactor{1.0};

  /*
   * A raw pointer to list of raw pointers to `LayoutableShadowNode`s that were
   * affected by the re-layout pass. If the field is not `nullptr`, a particular
   * `LayoutableShadowNode` implementation should add mutated nodes to this
   * list. The order is not specified. Nothing in this collection is owing (on
   * purpose), make sure the memory is managed responsibly.
   */
  std::vector<LayoutableShadowNode const *> *affectedNodes{};
};

} // namespace react
} // namespace facebook
