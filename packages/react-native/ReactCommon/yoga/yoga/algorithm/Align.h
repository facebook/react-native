/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

inline Align resolveChildAlignment(
    const yoga::Node* node,
    const yoga::Node* child) {
  const Align align = child->getStyle().alignSelf() == Align::Auto
      ? node->getStyle().alignItems()
      : child->getStyle().alignSelf();
  if (align == Align::Baseline && isColumn(node->getStyle().flexDirection())) {
    return Align::FlexStart;
  }
  return align;
}

} // namespace facebook::yoga
