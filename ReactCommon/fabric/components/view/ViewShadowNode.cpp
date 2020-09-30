/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"

namespace facebook {
namespace react {

const char ViewComponentName[] = "View";

bool ViewShadowNode::isLayoutOnly() const {
  const auto &viewProps = *std::static_pointer_cast<const ViewProps>(props_);

  return viewProps.collapsable &&
      // Generic Props
      viewProps.nativeId.empty() &&
      // Accessibility Props
      !viewProps.accessible &&
      // Style Props
      viewProps.opacity == 1.0 && !viewProps.backgroundColor &&
      !viewProps.foregroundColor && !viewProps.shadowColor &&
      viewProps.transform == Transform{} && viewProps.zIndex == 0 &&
      !viewProps.getClipsContentToBounds() &&
      // Layout Metrics
      getLayoutMetrics().borderWidth == EdgeInsets{};
}

} // namespace react
} // namespace facebook
