/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>

namespace facebook {
namespace react {

extern const char ViewComponentName[];

/*
 * `ShadowNode` for <View> component.
 */
class ViewShadowNode final : public ConcreteViewShadowNode<
                                 ViewComponentName,
                                 ViewProps,
                                 ViewEventEmitter> {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::View);
    return traits;
  }

  ViewShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  ViewShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

 private:
  void initialize() noexcept;
};

} // namespace react
} // namespace facebook
