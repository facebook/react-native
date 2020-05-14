/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewShadowNode.h>
#include <react/core/ConcreteComponentDescriptor.h>
#include "ViewProps.h"

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
    ViewProps const *oldViewProps =
        dynamic_cast<ViewProps const *>(props.get());
    ViewProps const *newViewProps =
        dynamic_cast<ViewProps const *>(newProps.get());

    SharedProps interpolatedPropsShared = cloneProps(newProps, {});
    ViewProps *interpolatedProps = const_cast<ViewProps *>(
        dynamic_cast<ViewProps const *>(interpolatedPropsShared.get()));

    interpolatedProps->opacity = oldViewProps->opacity +
        (newViewProps->opacity - oldViewProps->opacity) * animationProgress;

    interpolatedProps->transform = Transform::Interpolate(
        animationProgress, oldViewProps->transform, newViewProps->transform);

    // Android uses RawProps, not props, to update props on the platform...
    // Since interpolated props don't interpolate at all using RawProps, we need
    // to "re-hydrate" raw props after interpolating. This is what actually gets
    // sent to the mounting layer. This is a temporary hack, only for platforms
    // that use RawProps/folly::dynamic instead of concrete props on the
    // mounting layer. Once we can remove this, we should change `rawProps` to
    // be const again.
#ifdef ANDROID
    interpolatedProps->rawProps["opacity"] = interpolatedProps->opacity;

    interpolatedProps->rawProps["transform"] =
        (folly::dynamic)interpolatedProps->transform;
#endif

    return interpolatedPropsShared;
  };
};

} // namespace react
} // namespace facebook
