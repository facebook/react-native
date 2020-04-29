/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
<<<<<<< HEAD
#include "Bitfield.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"

=======
#include "BitUtils.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"

using namespace facebook::yoga;

>>>>>>> fb/0.62-stable
struct YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = {{YGUndefined, YGUndefined}};
  std::array<float, 4> margin = {};
  std::array<float, 4> border = {};
  std::array<float, 4> padding = {};

private:
<<<<<<< HEAD
  static constexpr size_t directionIdx = 0;
  static constexpr size_t didUseLegacyFlagIdx = 1;
  static constexpr size_t doesLegacyStretchFlagAffectsLayoutIdx = 2;
  static constexpr size_t hadOverflowIdx = 3;
  facebook::yoga::Bitfield<uint8_t, YGDirection, bool, bool, bool> flags_ =
      {YGDirectionInherit, false, false, false};
=======
  static constexpr size_t directionOffset = 0;
  static constexpr size_t didUseLegacyFlagOffset =
      directionOffset + facebook::yoga::detail::bitWidthFn<YGDirection>();
  static constexpr size_t doesLegacyStretchFlagAffectsLayoutOffset =
      didUseLegacyFlagOffset + 1;
  static constexpr size_t hadOverflowOffset =
      doesLegacyStretchFlagAffectsLayoutOffset + 1;
  uint8_t flags = 0;
>>>>>>> fb/0.62-stable

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

<<<<<<< HEAD
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
=======
  YGDirection direction() const {
    return facebook::yoga::detail::getEnumData<YGDirection>(
        flags, directionOffset);
  }

  void setDirection(YGDirection direction) {
    facebook::yoga::detail::setEnumData<YGDirection>(
        flags, directionOffset, direction);
  }

  bool didUseLegacyFlag() const {
    return facebook::yoga::detail::getBooleanData(
        flags, didUseLegacyFlagOffset);
  }

  void setDidUseLegacyFlag(bool val) {
    facebook::yoga::detail::setBooleanData(flags, didUseLegacyFlagOffset, val);
  }

  bool doesLegacyStretchFlagAffectsLayout() const {
    return facebook::yoga::detail::getBooleanData(
        flags, doesLegacyStretchFlagAffectsLayoutOffset);
  }

  void setDoesLegacyStretchFlagAffectsLayout(bool val) {
    facebook::yoga::detail::setBooleanData(
        flags, doesLegacyStretchFlagAffectsLayoutOffset, val);
  }

  bool hadOverflow() const {
    return facebook::yoga::detail::getBooleanData(flags, hadOverflowOffset);
  }
  void setHadOverflow(bool hadOverflow) {
    facebook::yoga::detail::setBooleanData(
        flags, hadOverflowOffset, hadOverflow);
>>>>>>> fb/0.62-stable
  }

  bool operator==(YGLayout layout) const;
  bool operator!=(YGLayout layout) const { return !(*this == layout); }
};
