/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>

#include <yoga/bits/NumericBitfield.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/node/CachedMeasurement.h>

namespace facebook::yoga {

#pragma pack(push)
#pragma pack(1)
struct LayoutResultFlags {
  uint32_t direction : 2;
  bool hadOverflow : 1;
};
#pragma pack(pop)

struct LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static constexpr int32_t MaxCachedMeasurements = 8;

  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = {{YGUndefined, YGUndefined}};
  std::array<float, 4> margin = {};
  std::array<float, 4> border = {};
  std::array<float, 4> padding = {};

private:
  LayoutResultFlags flags_{};

public:
  uint32_t computedFlexBasisGeneration = 0;
  FloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  YGDirection lastOwnerDirection = YGDirectionInherit;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<CachedMeasurement, MaxCachedMeasurements> cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = {{YGUndefined, YGUndefined}};

  CachedMeasurement cachedLayout{};

  YGDirection direction() const {
    return static_cast<YGDirection>(flags_.direction);
  }

  void setDirection(YGDirection direction) {
    flags_.direction = static_cast<uint32_t>(direction) & 0x03;
  }

  bool hadOverflow() const { return flags_.hadOverflow; }
  void setHadOverflow(bool hadOverflow) { flags_.hadOverflow = hadOverflow; }

  bool operator==(LayoutResults layout) const;
  bool operator!=(LayoutResults layout) const { return !(*this == layout); }
};

} // namespace facebook::yoga
