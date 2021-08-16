/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTShapeProps.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

class ARTBaseShadowNode {
 public:
  int test;
  virtual ARTElement::Shared getARTElement() const = 0;

  static void buildElements(
      ShadowNode const &parentNode,
      ARTElement::ListOfShared &outNodes) {
    for (auto const &child : parentNode.getChildren()) {
      auto baseShadowNode =
          std::dynamic_pointer_cast<ARTBaseShadowNode const>(child);
      if (baseShadowNode) {
        outNodes.push_back(baseShadowNode->getARTElement());
      }
    }
  }
};

} // namespace react
} // namespace facebook
