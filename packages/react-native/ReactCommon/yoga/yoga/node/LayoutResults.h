/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>

#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Edge.h>
#include <yoga/node/CachedMeasurement.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

struct LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static constexpr int32_t MaxCachedMeasurements = 8;

  uint32_t computedFlexBasisGeneration = 0;
  FloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  Direction lastOwnerDirection = Direction::Inherit;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<CachedMeasurement, MaxCachedMeasurements> cachedMeasurements = {};

  CachedMeasurement cachedLayout{};

  Direction direction() const {
    return direction_;
  }

  void setDirection(Direction direction) {
    direction_ = direction;
  }

  bool hadOverflow() const {
    return hadOverflow_;
  }

  void setHadOverflow(bool hadOverflow) {
    hadOverflow_ = hadOverflow;
  }

  float dimension(Dimension axis) const {
    return dimensions_[yoga::to_underlying(axis)];
  }

  void setDimension(Dimension axis, float dimension) {
    dimensions_[yoga::to_underlying(axis)] = dimension;
  }

  float measuredDimension(Dimension axis) const {
    return measuredDimensions_[yoga::to_underlying(axis)];
  }

  void setMeasuredDimension(Dimension axis, float dimension) {
    measuredDimensions_[yoga::to_underlying(axis)] = dimension;
  }

  float position(Edge cardinalEdge) const {
    assertCardinalEdge(cardinalEdge);
    return position_[yoga::to_underlying(cardinalEdge)];
  }

  void setPosition(Edge cardinalEdge, float dimension) {
    assertCardinalEdge(cardinalEdge);
    position_[yoga::to_underlying(cardinalEdge)] = dimension;
  }

  float margin(Edge cardinalEdge) const {
    assertCardinalEdge(cardinalEdge);
    return margin_[yoga::to_underlying(cardinalEdge)];
  }

  void setMargin(Edge cardinalEdge, float dimension) {
    assertCardinalEdge(cardinalEdge);
    margin_[yoga::to_underlying(cardinalEdge)] = dimension;
  }

  float border(Edge cardinalEdge) const {
    assertCardinalEdge(cardinalEdge);
    return border_[yoga::to_underlying(cardinalEdge)];
  }

  void setBorder(Edge cardinalEdge, float dimension) {
    assertCardinalEdge(cardinalEdge);
    border_[yoga::to_underlying(cardinalEdge)] = dimension;
  }

  float padding(Edge cardinalEdge) const {
    assertCardinalEdge(cardinalEdge);
    return padding_[yoga::to_underlying(cardinalEdge)];
  }

  void setPadding(Edge cardinalEdge, float dimension) {
    assertCardinalEdge(cardinalEdge);
    padding_[yoga::to_underlying(cardinalEdge)] = dimension;
  }

  bool operator==(LayoutResults layout) const;
  bool operator!=(LayoutResults layout) const {
    return !(*this == layout);
  }

 private:
  static inline void assertCardinalEdge(Edge edge) {
    assertFatal(
        static_cast<int>(edge) <= 3, "Edge must be top/left/bottom/right");
  }

  Direction direction_ : bitCount<Direction>() = Direction::Inherit;
  bool hadOverflow_ : 1 = false;

  std::array<float, 2> dimensions_ = {{YGUndefined, YGUndefined}};
  std::array<float, 2> measuredDimensions_ = {{YGUndefined, YGUndefined}};
  std::array<float, 4> position_ = {};
  std::array<float, 4> margin_ = {};
  std::array<float, 4> border_ = {};
  std::array<float, 4> padding_ = {};
};

} // namespace facebook::yoga
