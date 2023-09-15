/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UnimplementedViewComponentDescriptor.h"

namespace facebook::react {

ComponentHandle UnimplementedViewComponentDescriptor::getComponentHandle()
    const {
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName UnimplementedViewComponentDescriptor::getComponentName() const {
  return static_cast<const std::string*>(flavor_.get())->c_str();
}

Props::Shared UnimplementedViewComponentDescriptor::cloneProps(
    const PropsParserContext& context,
    const Props::Shared& props,
    const RawProps& rawProps) const {
  auto clonedProps =
      ConcreteComponentDescriptor<UnimplementedViewShadowNode>::cloneProps(
          context, props, rawProps);

  // We have to clone `Props` object one more time to make sure that we have
  // an unshared (and non-`const`) copy of it which we can mutate.
  RawProps emptyRawProps{};
  emptyRawProps.parse(rawPropsParser_, context);
  auto unimplementedViewProps = std::make_shared<UnimplementedViewProps>(
      context,
      static_cast<const UnimplementedViewProps&>(*clonedProps),
      emptyRawProps);

  unimplementedViewProps->setComponentName(getComponentName());
  return unimplementedViewProps;
};

} // namespace facebook::react
