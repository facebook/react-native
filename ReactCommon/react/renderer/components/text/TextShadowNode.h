/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/text/TextProps.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/ConcreteShadowNode.h>

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
#endif
    traits.set(ShadowNodeTraits::Trait::Text);

    return traits;
  }

  using ConcreteShadowNode::ConcreteShadowNode;

#ifdef ANDROID
  using BaseShadowNode = ConcreteShadowNode<
      TextComponentName,
      ShadowNode,
      TextProps,
      TextEventEmitter>;

  TextShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits), BaseTextShadowNode() {
    orderIndex_ = std::numeric_limits<decltype(orderIndex_)>::max();
  }
#endif
};

template <>
inline TextShadowNode const &traitCast<TextShadowNode const &>(
    ShadowNode const &shadowNode) {
  bool castable = shadowNode.getTraits().check(ShadowNodeTraits::Trait::Text);
  react_native_assert(castable);
  (void)castable;
  return static_cast<TextShadowNode const &>(shadowNode);
}

template <>
inline TextShadowNode const *traitCast<TextShadowNode const *>(
    ShadowNode const *shadowNode) {
  if (!shadowNode) {
    return nullptr;
  }
  bool castable = shadowNode->getTraits().check(ShadowNodeTraits::Trait::Text);
  if (!castable) {
    return nullptr;
  }
  return static_cast<TextShadowNode const *>(shadowNode);
}

} // namespace react
} // namespace facebook
