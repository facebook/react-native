/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlexboxAlgorithm.h"

namespace facebook {
namespace flexlayout {
namespace algo {

FLEX_LAYOUT_EXPORT auto IsBaselineNode(
    const FlexBoxStyle& node,
    const FlexItemStyleBase& flexItemStyle) -> bool {
  if (FlexDirectionIsColumn(node.flexDirection)) {
    return false;
  }
  return ResolveAlignment(flexItemStyle.alignSelf, node.alignItems) ==
      AlignItems::Baseline;
}

FLEX_LAYOUT_EXPORT auto ResolveAlignment(
    AlignSelf alignSelf,
    AlignItems alignItems) -> AlignItems {
  switch (alignSelf) {
    case AlignSelf::Auto:
      return alignItems;
    case AlignSelf::FlexStart:
      return AlignItems::FlexStart;
    case AlignSelf::Center:
      return AlignItems::Center;
    case AlignSelf::FlexEnd:
      return AlignItems::FlexEnd;
    case AlignSelf::Stretch:
      return AlignItems::Stretch;
    case AlignSelf::Baseline:
      return AlignItems::Baseline;
  }
}

} // namespace algo
} // namespace flexlayout
} // namespace facebook
