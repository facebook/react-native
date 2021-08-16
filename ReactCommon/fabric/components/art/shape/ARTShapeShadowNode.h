/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTBaseShadowNode.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTShapeProps.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char ARTShapeComponentName[];

/*
 * `ShadowNode` for <ARTShape> component.
 */
class ARTShapeShadowNode : public ConcreteShadowNode<
                               ARTShapeComponentName,
                               ShadowNode,
                               ARTShapeProps>,
                           public ARTBaseShadowNode {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;

  virtual ARTElement::Shared getARTElement() const override;
};

} // namespace react
} // namespace facebook
