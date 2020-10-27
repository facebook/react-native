/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/unimplementedview/UnimplementedViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <UnimplementedView> component.
 */
class UnimplementedViewComponentDescriptor final
    : public ConcreteComponentDescriptor<UnimplementedViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  /*
   * Returns `name` and `handle` based on a `flavor`, not on static data from
   * `UnimplementedViewShadowNode`.
   */
  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

  /*
   * In addtion to base implementation, stores a component name inside cloned
   * `Props` object.
   */
  Props::Shared cloneProps(Props::Shared const &props, RawProps const &rawProps)
      const override;
};

} // namespace react
} // namespace facebook
