/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "YGFloatOptional.h"
#include "Yoga-internal.h"

constexpr std::array<float, 2> kYGDefaultDimensionValues = {
    {YGUndefined, YGUndefined}};

struct YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = kYGDefaultDimensionValues;
  std::array<float, 6> margin = {};
  std::array<float, 6> border = {};
  std::array<float, 6> padding = {};
  YGDirection direction : 2;
  bool didUseLegacyFlag : 1;
  bool doesLegacyStretchFlagAffectsLayout : 1;
  bool hadOverflow : 1;

  uint32_t computedFlexBasisGeneration = 0;
  YGFloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  YGDirection lastOwnerDirection = (YGDirection) -1;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<YGCachedMeasurement, YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = kYGDefaultDimensionValues;

  YGCachedMeasurement cachedLayout = YGCachedMeasurement();

  YGLayout()
      : direction(YGDirectionInherit),
        didUseLegacyFlag(false),
        doesLegacyStretchFlagAffectsLayout(false),
        hadOverflow(false) {}

  bool operator==(YGLayout layout) const;
  bool operator!=(YGLayout layout) const {
    return !(*this == layout);
  }
};
