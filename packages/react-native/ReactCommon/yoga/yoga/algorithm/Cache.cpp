/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/algorithm/Cache.h>
#include <yoga/algorithm/PixelGrid.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

static inline bool sizeIsExactAndMatchesOldMeasuredSize(
    MeasureMode sizeMode,
    float size,
    float lastComputedSize) {
  return sizeMode == MeasureMode::Exactly &&
      yoga::inexactEquals(size, lastComputedSize);
}

static inline bool oldSizeIsUnspecifiedAndStillFits(
    MeasureMode sizeMode,
    float size,
    MeasureMode lastSizeMode,
    float lastComputedSize) {
  return sizeMode == MeasureMode::AtMost &&
      lastSizeMode == MeasureMode::Undefined &&
      (size >= lastComputedSize || yoga::inexactEquals(size, lastComputedSize));
}

static inline bool newMeasureSizeIsStricterAndStillValid(
    MeasureMode sizeMode,
    float size,
    MeasureMode lastSizeMode,
    float lastSize,
    float lastComputedSize) {
  return lastSizeMode == MeasureMode::AtMost &&
      sizeMode == MeasureMode::AtMost && !std::isnan(lastSize) &&
      !std::isnan(size) && !std::isnan(lastComputedSize) && lastSize > size &&
      (lastComputedSize <= size || yoga::inexactEquals(size, lastComputedSize));
}

bool canUseCachedMeasurement(
    const MeasureMode widthMode,
    const float availableWidth,
    const MeasureMode heightMode,
    const float availableHeight,
    const MeasureMode lastWidthMode,
    const float lastAvailableWidth,
    const MeasureMode lastHeightMode,
    const float lastAvailableHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const yoga::Config* const config) {
  if ((!std::isnan(lastComputedHeight) && lastComputedHeight < 0) ||
      (!std::isnan(lastComputedWidth) && lastComputedWidth < 0)) {
    return false;
  }

  const float pointScaleFactor = config->getPointScaleFactor();

  bool useRoundedComparison = config != nullptr && pointScaleFactor != 0;
  const float effectiveWidth = useRoundedComparison
      ? roundValueToPixelGrid(availableWidth, pointScaleFactor, false, false)
      : availableWidth;
  const float effectiveHeight = useRoundedComparison
      ? roundValueToPixelGrid(availableHeight, pointScaleFactor, false, false)
      : availableHeight;
  const float effectiveLastWidth = useRoundedComparison
      ? roundValueToPixelGrid(
            lastAvailableWidth, pointScaleFactor, false, false)
      : lastAvailableWidth;
  const float effectiveLastHeight = useRoundedComparison
      ? roundValueToPixelGrid(
            lastAvailableHeight, pointScaleFactor, false, false)
      : lastAvailableHeight;

  const bool hasSameWidthSpec = lastWidthMode == widthMode &&
      yoga::inexactEquals(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode &&
      yoga::inexactEquals(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      sizeIsExactAndMatchesOldMeasuredSize(
          widthMode, availableWidth - marginRow, lastComputedWidth) ||
      oldSizeIsUnspecifiedAndStillFits(
          widthMode,
          availableWidth - marginRow,
          lastWidthMode,
          lastComputedWidth) ||
      newMeasureSizeIsStricterAndStillValid(
          widthMode,
          availableWidth - marginRow,
          lastWidthMode,
          lastAvailableWidth,
          lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec ||
      sizeIsExactAndMatchesOldMeasuredSize(
          heightMode, availableHeight - marginColumn, lastComputedHeight) ||
      oldSizeIsUnspecifiedAndStillFits(
          heightMode,
          availableHeight - marginColumn,
          lastHeightMode,
          lastComputedHeight) ||
      newMeasureSizeIsStricterAndStillValid(
          heightMode,
          availableHeight - marginColumn,
          lastHeightMode,
          lastAvailableHeight,
          lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

} // namespace facebook::yoga
