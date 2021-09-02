/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UnimplementedViewComponentDescriptor.h"

namespace facebook {
namespace react {

ComponentHandle UnimplementedViewComponentDescriptor::getComponentHandle()
    const {
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName UnimplementedViewComponentDescriptor::getComponentName() const {
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

Props::Shared UnimplementedViewComponentDescriptor::cloneProps(
    Props::Shared const &props,
    RawProps const &rawProps) const {
  auto clonedProps =
      ConcreteComponentDescriptor<UnimplementedViewShadowNode>::cloneProps(
          props, rawProps);
  assert(std::dynamic_pointer_cast<UnimplementedViewProps const>(clonedProps));

  // We have to clone `Props` object one more time to make sure that we have
  // an unshared (and non-`const`) copy of it which we can mutate.
  RawProps emptyRawProps{};
  emptyRawProps.parse(rawPropsParser_);
  auto unimplementedViewProps = std::make_shared<UnimplementedViewProps>(
      *std::static_pointer_cast<UnimplementedViewProps const>(clonedProps),
      emptyRawProps);

  unimplementedViewProps->setComponentName(getComponentName());
  return unimplementedViewProps;
};

} // namespace react
} // namespace facebook
