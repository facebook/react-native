/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"
#include <react/components/view/primitives.h>

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
      // Pointer events Props
      (viewProps.pointerEvents == PointerEventsMode::Auto ||
       viewProps.pointerEvents == PointerEventsMode::BoxNone) &&
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
