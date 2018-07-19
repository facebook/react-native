/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "YGFloatOptional.h"
#include "Yoga-internal.h"

struct YGLayout {
  std::array<float, 4> position;
  std::array<float, 2> dimensions;
  std::array<float, 6> margin;
  std::array<float, 6> border;
  std::array<float, 6> padding;
  YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  YGFloatOptional computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  YGDirection lastOwnerDirection;

  uint32_t nextCachedMeasurementsIndex;
  std::array<YGCachedMeasurement, YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements;
  std::array<float, 2> measuredDimensions;

  YGCachedMeasurement cachedLayout;
  bool didUseLegacyFlag;
  bool doesLegacyStretchFlagAffectsLayout;

  YGLayout();

  bool operator==(YGLayout layout) const;
  bool operator!=(YGLayout layout) const;
};
