/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/text/BaseTextShadowNode.h>
#include <fabric/components/text/TextProps.h>
#include <fabric/components/view/ViewEventEmitter.h>
#include <fabric/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode
    : public ConcreteShadowNode<TextComponentName, TextProps, TextEventEmitter>,
      public BaseTextShadowNode {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace react
} // namespace facebook
