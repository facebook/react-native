/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <vector>
#include "FlexItemStyle.h"
#include "FlexLayoutMacros.h"
#include "FlexboxAlgorithm.h"
#include "LayoutOutput.h"
#include "Type.h"

namespace facebook {
namespace flexlayout {
namespace core {

using namespace facebook::flexlayout::style;
using namespace facebook::flexlayout::layoutoutput;

template <typename MeasureData, typename Result>
FLEX_LAYOUT_EXPORT auto calculateLayout(
    const FlexBoxStyle& parent,
    const std::vector<FlexItemStyle<MeasureData, Result>>& children,
    const Float minWidth,
    const Float maxWidth,
    const Float minHeight,
    const Float maxHeight,
    const Float ownerWidth) -> LayoutOutput<Result> {
  return algo::calculateLayoutInternal(
      parent, children, minWidth, maxWidth, minHeight, maxHeight, ownerWidth);
}

} // namespace core
} // namespace flexlayout
} // namespace facebook
