/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/ResolveValue.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/Comparison.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

inline float paddingAndBorderForAxis(
    const yoga::Node* const node,
    const FlexDirection axis,
    const float widthSize) {
  // The total padding/border for a given axis does not depend on the direction
  // so hardcoding LTR here to avoid piping direction to this function
  return node->getInlineStartPaddingAndBorder(axis, Direction::LTR, widthSize) +
      node->getInlineEndPaddingAndBorder(axis, Direction::LTR, widthSize);
}

inline FloatOptional boundAxisWithinMinAndMax(
    const yoga::Node* const node,
    const FlexDirection axis,
    const FloatOptional value,
    const float axisSize) {
  FloatOptional min;
  FloatOptional max;

  if (isColumn(axis)) {
    min = yoga::resolveValue(
        node->getStyle().minDimension(Dimension::Height), axisSize);
    max = yoga::resolveValue(
        node->getStyle().maxDimension(Dimension::Height), axisSize);
  } else if (isRow(axis)) {
    min = yoga::resolveValue(
        node->getStyle().minDimension(Dimension::Width), axisSize);
    max = yoga::resolveValue(
        node->getStyle().maxDimension(Dimension::Width), axisSize);
  }

  if (max >= FloatOptional{0} && value > max) {
    return max;
  }

  if (min >= FloatOptional{0} && value < min) {
    return min;
  }

  return value;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
inline float boundAxis(
    const yoga::Node* const node,
    const FlexDirection axis,
    const float value,
    const float axisSize,
    const float widthSize) {
  return yoga::maxOrDefined(
      boundAxisWithinMinAndMax(node, axis, FloatOptional{value}, axisSize)
          .unwrap(),
      paddingAndBorderForAxis(node, axis, widthSize));
}

} // namespace facebook::yoga
