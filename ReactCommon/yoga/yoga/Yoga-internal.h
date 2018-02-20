/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "Yoga.h"

using YGVector = std::vector<YGNodeRef>;

YG_EXTERN_C_BEGIN

WIN_EXPORT float YGRoundValueToPixelGrid(const float value,
                                         const float pointScaleFactor,
                                         const bool forceCeil,
                                         const bool forceFloor);

YG_EXTERN_C_END

extern const std::array<YGEdge, 4> trailing;
extern const std::array<YGEdge, 4> leading;
extern bool YGValueEqual(const YGValue a, const YGValue b);
extern const YGValue YGValueUndefined;
extern const YGValue YGValueAuto;
extern const YGValue YGValueZero;

template <std::size_t size>
bool YGValueArrayEqual(
    const std::array<YGValue, size> val1,
    const std::array<YGValue, size> val2) {
  bool areEqual = true;
  for (uint32_t i = 0; i < size && areEqual; ++i) {
    areEqual = YGValueEqual(val1[i], val2[i]);
  }
  return areEqual;
}

const YGValue kYGValueUndefined = {YGUndefined, YGUnitUndefined};
const YGValue kYGValueAuto = {YGUndefined, YGUnitAuto};
const std::array<YGValue, YGEdgeCount> kYGDefaultEdgeValuesUnit = {
    {kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined,
     kYGValueUndefined}};
const std::array<YGValue, 2> kYGDefaultDimensionValuesAutoUnit = {
    {kYGValueAuto, kYGValueAuto}};
const std::array<YGValue, 2> kYGDefaultDimensionValuesUnit = {
    {kYGValueUndefined, kYGValueUndefined}};

struct YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  YGMeasureMode widthMeasureMode;
  YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  bool operator==(YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!std::isnan(availableWidth) ||
        !std::isnan(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!std::isnan(availableHeight) ||
        !std::isnan(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!std::isnan(computedWidth) || !std::isnan(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!std::isnan(computedHeight) ||
        !std::isnan(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define YG_MAX_CACHED_RESULT_COUNT 16

struct YGLayout {
  std::array<float, 4> position;
  std::array<float, 2> dimensions;
  std::array<float, 6> margin;
  std::array<float, 6> border;
  std::array<float, 6> padding;
  YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  YGCachedMeasurement cachedMeasurements[YG_MAX_CACHED_RESULT_COUNT];
  std::array<float, 2> measuredDimensions;

  YGCachedMeasurement cachedLayout;
  bool didUseLegacyFlag;
  bool doesLegacyStretchFlagAffectsLayout;

  bool operator==(YGLayout layout) const {
    bool isEqual = position == layout.position &&
        dimensions == layout.dimensions && margin == layout.margin &&
        border == layout.border && padding == layout.padding &&
        direction == layout.direction && hadOverflow == layout.hadOverflow &&
        lastParentDirection == layout.lastParentDirection &&
        nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
        cachedLayout == layout.cachedLayout;

    for (uint32_t i = 0; i < YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
      isEqual =
          isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
    }

    if (!YGFloatIsUndefined(computedFlexBasis) ||
        !YGFloatIsUndefined(layout.computedFlexBasis)) {
      isEqual = isEqual && (computedFlexBasis == layout.computedFlexBasis);
    }
    if (!YGFloatIsUndefined(measuredDimensions[0]) ||
        !YGFloatIsUndefined(layout.measuredDimensions[0])) {
      isEqual =
          isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
    }
    if (!YGFloatIsUndefined(measuredDimensions[1]) ||
        !YGFloatIsUndefined(layout.measuredDimensions[1])) {
      isEqual =
          isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
    }

    return isEqual;
  }

  bool operator!=(YGLayout layout) const {
    return !(*this == layout);
  }
};

struct YGConfig {
  bool experimentalFeatures[YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour;
  float pointScaleFactor;
  YGLogger logger;
  YGNodeClonedFunc cloneNodeCallback;
  void* context;
};

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static const YGLayout gYGNodeLayoutDefaults = {
    .position = {},
    .dimensions = {{YGUndefined, YGUndefined}},
    .margin = {},
    .border = {},
    .padding = {},
    .direction = YGDirectionInherit,
    .computedFlexBasisGeneration = 0,
    .computedFlexBasis = YGUndefined,
    .hadOverflow = false,
    .generationCount = 0,
    .lastParentDirection = (YGDirection)-1,
    .nextCachedMeasurementsIndex = 0,
    .cachedMeasurements = {},
    .measuredDimensions = {{YGUndefined, YGUndefined}},
    .cachedLayout =
        {
            .availableWidth = 0,
            .availableHeight = 0,
            .widthMeasureMode = (YGMeasureMode)-1,
            .heightMeasureMode = (YGMeasureMode)-1,
            .computedWidth = -1,
            .computedHeight = -1,
        },
    .didUseLegacyFlag = false,
    .doesLegacyStretchFlagAffectsLayout = false,
};

extern bool YGFloatsEqual(const float a, const float b);
extern bool YGValueEqual(const YGValue a, const YGValue b);
extern const YGValue* YGComputedEdgeValue(
    const std::array<YGValue, YGEdgeCount>& edges,
    const YGEdge edge,
    const YGValue* const defaultValue);
