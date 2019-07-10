/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "CompactValue.h"
#include "Yoga.h"

using YGVector = std::vector<YGNodeRef>;

YG_EXTERN_C_BEGIN

void YGNodeCalculateLayoutWithContext(
    YGNodeRef node,
    float availableWidth,
    float availableHeight,
    YGDirection ownerDirection,
    void* layoutContext);

YG_EXTERN_C_END

namespace facebook {
namespace yoga {

inline bool isUndefined(float value) {
  return std::isnan(value);
}

} // namespace yoga
} // namespace facebook

using namespace facebook;

extern const std::array<YGEdge, 4> trailing;
extern const std::array<YGEdge, 4> leading;
extern const YGValue YGValueUndefined;
extern const YGValue YGValueAuto;
extern const YGValue YGValueZero;

struct YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  YGMeasureMode widthMeasureMode;
  YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  YGCachedMeasurement()
      : availableWidth(0),
        availableHeight(0),
        widthMeasureMode((YGMeasureMode) -1),
        heightMeasureMode((YGMeasureMode) -1),
        computedWidth(-1),
        computedHeight(-1) {}

  bool operator==(YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!yoga::isUndefined(availableWidth) ||
        !yoga::isUndefined(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!yoga::isUndefined(availableHeight) ||
        !yoga::isUndefined(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!yoga::isUndefined(computedWidth) ||
        !yoga::isUndefined(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!yoga::isUndefined(computedHeight) ||
        !yoga::isUndefined(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empirical data:
// 98% of analyzed layouts require less than 8 entries.
#define YG_MAX_CACHED_RESULT_COUNT 8

namespace facebook {
namespace yoga {
namespace detail {

template <size_t Size>
class Values {
private:
  std::array<CompactValue, Size> values_;

public:
  Values() = default;
  explicit Values(const YGValue& defaultValue) noexcept {
    values_.fill(defaultValue);
  }

  const CompactValue& operator[](size_t i) const noexcept { return values_[i]; }
  CompactValue& operator[](size_t i) noexcept { return values_[i]; }

  template <size_t I>
  YGValue get() const noexcept {
    return std::get<I>(values_);
  }

  template <size_t I>
  void set(YGValue& value) noexcept {
    std::get<I>(values_) = value;
  }

  template <size_t I>
  void set(YGValue&& value) noexcept {
    set<I>(value);
  }

  bool operator==(const Values& other) const noexcept {
    for (size_t i = 0; i < Size; ++i) {
      if (values_[i] != other.values_[i]) {
        return false;
      }
    }
    return true;
  }

  Values& operator=(const Values& other) = default;
};

} // namespace detail
} // namespace yoga
} // namespace facebook

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

extern bool YGFloatsEqual(const float a, const float b);
extern facebook::yoga::detail::CompactValue YGComputedEdgeValue(
    const facebook::yoga::detail::Values<
        facebook::yoga::enums::count<YGEdge>()>& edges,
    YGEdge edge,
    facebook::yoga::detail::CompactValue defaultValue);
