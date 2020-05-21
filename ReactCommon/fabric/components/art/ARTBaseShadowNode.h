/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTShapeProps.h>
#include <react/components/art/Element.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

class ARTBaseShadowNode {
 public:
  int test;
  virtual Element::Shared getElement() const = 0;

  static void buildElements(
      ShadowNode const &parentNode,
      Element::ListOfShared &outNodes) {
    for (auto const &child : parentNode.getChildren()) {
      auto baseShadowNode =
          std::dynamic_pointer_cast<ARTBaseShadowNode const>(child);
      if (baseShadowNode) {
        outNodes.push_back(baseShadowNode->getElement());
      }
    }
  }
};

} // namespace react
} // namespace facebook
