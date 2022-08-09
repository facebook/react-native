/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/RawTextProps.h>
#include <react/renderer/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
class RawTextShadowNode : public ConcreteShadowNode<
                              RawTextComponentName,
                              ShadowNode,
                              RawTextProps> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RawText);
    return traits;
  }
};

template <>
inline RawTextShadowNode const &traitCast<RawTextShadowNode const &>(
    ShadowNode const &shadowNode) {
  bool castable =
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::RawText);
  react_native_assert(castable);
  (void)castable;
  return static_cast<RawTextShadowNode const &>(shadowNode);
}

template <>
inline RawTextShadowNode const *traitCast<RawTextShadowNode const *>(
    ShadowNode const *shadowNode) {
  if (!shadowNode) {
    return nullptr;
  }
  bool castable =
      shadowNode->getTraits().check(ShadowNodeTraits::Trait::RawText);
  if (!castable) {
    return nullptr;
  }
  return static_cast<RawTextShadowNode const *>(shadowNode);
}

} // namespace react
} // namespace facebook
