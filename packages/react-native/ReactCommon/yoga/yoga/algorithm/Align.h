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

inline YGAlign resolveChildAlignment(
    const yoga::Node* node,
    const yoga::Node* child) {
  const YGAlign align = child->getStyle().alignSelf() == YGAlignAuto
      ? node->getStyle().alignItems()
      : child->getStyle().alignSelf();
  if (align == YGAlignBaseline && isColumn(node->getStyle().flexDirection())) {
    return YGAlignFlexStart;
  }
  return align;
}

} // namespace facebook::yoga
