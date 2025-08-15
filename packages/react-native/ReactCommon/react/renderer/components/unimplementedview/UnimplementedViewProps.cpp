/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/unimplementedview/UnimplementedViewProps.h>

namespace facebook::react {

void UnimplementedViewProps::setComponentName(ComponentName componentName) {
  componentName_ = componentName;
}

ComponentName UnimplementedViewProps::getComponentName() const {
  return componentName_;
}

#ifdef RN_SERIALIZABLE_STATE

folly::dynamic UnimplementedViewProps::getDiffProps(
    const Props* prevProps) const {
  static const auto defaultProps = UnimplementedViewProps();

  const UnimplementedViewProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const UnimplementedViewProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  if (componentName_ != oldProps->componentName_) {
    result["name"] = componentName_;
  }

  return result;
}

#endif

} // namespace facebook::react
