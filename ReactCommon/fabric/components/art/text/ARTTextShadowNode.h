/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTBaseShadowNode.h>
#include <react/components/art/ARTTextProps.h>
#include <react/components/art/Element.h>
#include <react/components/art/Text.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char ARTTextComponentName[];

/*
 * `ShadowNode` for <ARTText> component.
 */
class ARTTextShadowNode
    : public ConcreteShadowNode<ARTTextComponentName, ShadowNode, ARTTextProps>,
      public ARTBaseShadowNode {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;

  virtual Element::Shared getElement() const override;
};

} // namespace react
} // namespace facebook
