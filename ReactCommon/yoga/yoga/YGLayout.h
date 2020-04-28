/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "Bitfield.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"

struct YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = {{YGUndefined, YGUndefined}};
  std::array<float, 4> margin = {};
  std::array<float, 4> border = {};
  std::array<float, 4> padding = {};

private:
  static constexpr size_t directionIdx = 0;
  static constexpr size_t didUseLegacyFlagIdx = 1;
  static constexpr size_t doesLegacyStretchFlagAffectsLayoutIdx = 2;
  static constexpr size_t hadOverflowIdx = 3;
  facebook::yoga::Bitfield<uint8_t, YGDirection, bool, bool, bool> flags_ =
      {YGDirectionInherit, false, false, false};

public:
  uint32_t computedFlexBasisGeneration = 0;
  YGFloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  YGDirection lastOwnerDirection = (YGDirection) -1;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<YGCachedMeasurement, YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = {{YGUndefined, YGUndefined}};

  YGCachedMeasurement cachedLayout = YGCachedMeasurement();

  YGDirection direction() const { return flags_.at<directionIdx>(); }
  decltype(flags_)::Ref<directionIdx> direction() {
    return flags_.at<directionIdx>();
  }

  bool didUseLegacyFlag() const { return flags_.at<didUseLegacyFlagIdx>(); }
  decltype(flags_)::Ref<didUseLegacyFlagIdx> didUseLegacyFlag() {
    return flags_.at<didUseLegacyFlagIdx>();
  }

  bool doesLegacyStretchFlagAffectsLayout() const {
    return flags_.at<doesLegacyStretchFlagAffectsLayoutIdx>();
  }
  decltype(flags_)::Ref<doesLegacyStretchFlagAffectsLayoutIdx>
  doesLegacyStretchFlagAffectsLayout() {
    return flags_.at<doesLegacyStretchFlagAffectsLayoutIdx>();
  }

  bool hadOverflow() const { return flags_.at<hadOverflowIdx>(); }
  decltype(flags_)::Ref<hadOverflowIdx> hadOverflow() {
    return flags_.at<hadOverflowIdx>();
  }

  bool operator==(YGLayout layout) const;
  bool operator!=(YGLayout layout) const { return !(*this == layout); }
};
