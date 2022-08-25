/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <vector>
#include "FlexItem.h"

namespace facebook {
namespace flexlayout {
namespace algo {

struct FlexLine {
  std::vector<FlexItem> flexItems;
  float crossDim = 0.0f;
  float mainDim = 0.0f;
  float maxBaseline = 0.0f;

  /**
   Resolves flexible lengths on the main axis according to
   https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths .

   Preconditions:
   - All items have defined flex base size (i.e. \c
   FlexItem::computedFlexBasis), see
   https://www.w3.org/TR/css-flexbox-1/#flex-base-size

   Postconditions:
   - All items have defined used main sizes (i.e. \c FlexItem::targetMainSize)

   \returns the amount of free space available for justification
   */
  auto resolveFlexibleLengths(
      FlexDirection mainAxis,
      Float availableInnerMainDim,
      Float availableInnerWidth,
      bool sizeBasedOnContent) -> Float;
};

} // namespace algo
} // namespace flexlayout
} // namespace facebook
