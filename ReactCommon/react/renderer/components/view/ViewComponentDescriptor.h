/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "ViewProps.h"
#include "ViewPropsInterpolation.h"

namespace facebook {
namespace react {

class ViewComponentDescriptor
    : public ConcreteComponentDescriptor<ViewShadowNode> {
 public:
  ViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ViewShadowNode>(parameters) {}

  virtual SharedProps interpolateProps(
      float animationProgress,
      const SharedProps &props,
      const SharedProps &newProps) const override {
    SharedProps interpolatedPropsShared = cloneProps(newProps, {});

    interpolateViewProps(
        animationProgress, props, newProps, interpolatedPropsShared);

    return interpolatedPropsShared;
  };
};

} // namespace react
} // namespace facebook
