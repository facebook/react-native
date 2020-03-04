/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/text/BaseTextShadowNode.h>
#include <react/components/text/TextProps.h>
#include <react/components/view/ViewEventEmitter.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode : public ConcreteShadowNode<
                           TextComponentName,
                           ShadowNode,
                           TextProps,
                           TextEventEmitter>,
                       public BaseTextShadowNode {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteShadowNode::BaseTraits();

#ifdef ANDROID
    traits.set(ShadowNodeTraits::Trait::FormsView);
    traits.set(ShadowNodeTraits::Trait::FormsStackingContext);
#endif

    return traits;
  }

  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace react
} // namespace facebook
