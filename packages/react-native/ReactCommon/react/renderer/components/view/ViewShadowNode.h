/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>

namespace facebook::react {

extern const char ViewComponentName[];

/**
 * Implementation of the ViewProps that propagates feature flag.
 */
class ViewShadowNodeProps final : public ViewProps {
 public:
  ViewShadowNodeProps() = default;
  ViewShadowNodeProps(
      const PropsParserContext& context,
      const ViewShadowNodeProps& sourceProps,
      const RawProps& rawProps);
};

/*
 * `ShadowNode` for <View> component.
 */
class ViewShadowNode final : public ConcreteViewShadowNode<
                                 ViewComponentName,
                                 ViewShadowNodeProps,
                                 ViewEventEmitter> {
 public:
  ViewShadowNode(
      const ShadowNodeFragment& fragment,
      const ShadowNodeFamily::Shared& family,
      ShadowNodeTraits traits);

  ViewShadowNode(
      const ShadowNode& sourceShadowNode,
      const ShadowNodeFragment& fragment);

 private:
  void initialize() noexcept;
};

} // namespace facebook::react
