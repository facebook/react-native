/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "YGNode.h"
#include "Yoga-internal.h"

// This struct is an helper model to hold the data for step 4 of flexbox
// algo, which is collecting the flex items in a line.
//
// - itemsOnLine: Number of items which can fit in a line considering the
// available Inner dimension, the flex items computed flexbasis and their
// margin. It may be different than the difference between start and end
// indicates because we skip over absolute-positioned items.
//
// - sizeConsumedOnCurrentLine: It is accumulation of the dimensions and margin
// of all the children on the current line. This will be used in order to either
// set the dimensions of the node if none already exist or to compute the
// remaining space left for the flexible children.
//
// - totalFlexGrowFactors: total flex grow factors of flex items which are to be
// layed in the current line
//
// - totalFlexShrinkFactors: total flex shrink factors of flex items which are
// to be layed in the current line
//
// - endOfLineIndex: Its the end index of the last flex item which was examined
// and it may or may not be part of the current line(as it may be absolutely
// positioned or inculding it may have caused to overshoot availableInnerDim)
//
// - relativeChildren: Maintain a vector of the child nodes that can shrink
// and/or grow.

struct YGCollectFlexItemsRowValues {
  uint32_t itemsOnLine;
  float sizeConsumedOnCurrentLine;
  float totalFlexGrowFactors;
  float totalFlexShrinkScaledFactors;
  float endOfLineIndex;
  std::vector<YGNodeRef> relativeChildren;
  float remainingFreeSpace;
  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of parent.
  float mainDim;
  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  float crossDim;
};

bool YGValueEqual(const YGValue a, const YGValue b);

// This custom float equality function returns true if either absolute
// difference between two floats is less than 0.0001f or both are undefined.
bool YGFloatsEqual(const float a, const float b);

// We need custom max function, since we want that, if one argument is
// YGUndefined then the max funtion should return the other argument as the max
// value. We wouldn't have needed a custom max function if YGUndefined was NAN
// as fmax has the same behaviour, but with NAN we cannot use `-ffast-math`
// compiler flag.
float YGFloatMax(const float a, const float b);

// We need custom min function, since we want that, if one argument is
// YGUndefined then the min funtion should return the other argument as the min
// value. We wouldn't have needed a custom min function if YGUndefined was NAN
// as fmin has the same behaviour, but with NAN we cannot use `-ffast-math`
// compiler flag.
float YGFloatMin(const float a, const float b);

// This custom float comparision function compares the array of float with
// YGFloatsEqual, as the default float comparision operator will not work(Look
// at the comments of YGFloatsEqual function).
template <std::size_t size>
bool YGFloatArrayEqual(
    const std::array<float, size>& val1,
    const std::array<float, size>& val2) {
  bool areEqual = true;
  for (std::size_t i = 0; i < size && areEqual; ++i) {
    areEqual = YGFloatsEqual(val1[i], val2[i]);
  }
  return areEqual;
}

// This function returns 0 if YGFloatIsUndefined(val) is true and val otherwise
float YGFloatSanitize(const float& val);

// This function unwraps optional and returns YGUndefined if not defined or
// op.value otherwise
// TODO: Get rid off this function
float YGUnwrapFloatOptional(const YGFloatOptional& op);

// This function returns true if val and optional both are undefined or if val
// and optional.val is true, otherwise its false.
bool YGFloatOptionalFloatEquals(
    const YGFloatOptional& optional,
    const float& val);

YGFlexDirection YGFlexDirectionCross(
    const YGFlexDirection flexDirection,
    const YGDirection direction);

inline bool YGFlexDirectionIsRow(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionRow ||
      flexDirection == YGFlexDirectionRowReverse;
}

inline YGFloatOptional YGResolveValue(const YGValue value, const float parentSize) {
  switch (value.unit) {
    case YGUnitUndefined:
    case YGUnitAuto:
      return {true, 0};
    case YGUnitPoint:
      return {false, value.value};
    case YGUnitPercent:
      return {false, static_cast<float>(value.value * parentSize * 0.01)};
  }
  return {true, 0};
}

inline bool YGFlexDirectionIsColumn(const YGFlexDirection flexDirection) {
  return flexDirection == YGFlexDirectionColumn ||
      flexDirection == YGFlexDirectionColumnReverse;
}

inline YGFlexDirection YGResolveFlexDirection(
    const YGFlexDirection flexDirection,
    const YGDirection direction) {
  if (direction == YGDirectionRTL) {
    if (flexDirection == YGFlexDirectionRow) {
      return YGFlexDirectionRowReverse;
    } else if (flexDirection == YGFlexDirectionRowReverse) {
      return YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static inline float YGResolveValueMargin(
    const YGValue value,
    const float parentSize) {
  return value.unit == YGUnitAuto ? 0 : YGUnwrapFloatOptional(YGResolveValue(value, parentSize));
}
