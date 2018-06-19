/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/AttributedString.h>
#include <fabric/attributedstring/TextAttributes.h>
#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/text/BaseTextShadowNode.h>
#include <fabric/text/TextProps.h>
#include <fabric/text/TextShadowNode.h>

namespace facebook {
namespace react {

class TextShadowNode;

using SharedTextShadowNode = std::shared_ptr<const TextShadowNode>;

class TextShadowNode:
  public ConcreteShadowNode<TextProps>,
  public BaseTextShadowNode {

public:

  using ConcreteShadowNode::ConcreteShadowNode;

  ComponentName getComponentName() const override;
};

} // namespace react
} // namespace facebook
