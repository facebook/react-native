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
    SizingMode sizeMode,
    float size,
    float lastComputedSize) {
  return sizeMode == SizingMode::StretchFit &&
      yoga::inexactEquals(size, lastComputedSize);
}

static inline bool oldSizeIsMaxContentAndStillFits(
    SizingMode sizeMode,
    float size,
    SizingMode lastSizeMode,
    float lastComputedSize) {
  return sizeMode == SizingMode::FitContent &&
      lastSizeMode == SizingMode::MaxContent &&
      (size >= lastComputedSize || yoga::inexactEquals(size, lastComputedSize));
}

static inline bool newSizeIsStricterAndStillValid(
    SizingMode sizeMode,
    float size,
    SizingMode lastSizeMode,
    float lastSize,
    float lastComputedSize) {
  return lastSizeMode == SizingMode::FitContent &&
      sizeMode == SizingMode::FitContent && yoga::isDefined(lastSize) &&
      yoga::isDefined(size) && yoga::isDefined(lastComputedSize) &&
      lastSize > size &&
      (lastComputedSize <= size || yoga::inexactEquals(size, lastComputedSize));
}

bool canUseCachedMeasurement(
    const SizingMode widthMode,
    const float availableWidth,
    const SizingMode heightMode,
    const float availableHeight,
    const SizingMode lastWidthMode,
    const float lastAvailableWidth,
    const SizingMode lastHeightMode,
    const float lastAvailableHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const yoga::Config* const config) {
  if ((yoga::isDefined(lastComputedHeight) && lastComputedHeight < 0) ||
      (yoga::isDefined(lastComputedWidth) && lastComputedWidth < 0)) {
    return false;
  }

  const float pointScaleFactor = config->getPointScaleFactor();
  bool useRoundedComparison = config != nullptr && pointScaleFactor != 0;

  auto roundIfNeeded = [&](float value) {
    return useRoundedComparison
        ? roundValueToPixelGrid(value, pointScaleFactor, false, false)
        : value;
  };

  const float effectiveWidth = roundIfNeeded(availableWidth);
  const float effectiveHeight = roundIfNeeded(availableHeight);
  const float effectiveLastWidth = roundIfNeeded(lastAvailableWidth);
  const float effectiveLastHeight = roundIfNeeded(lastAvailableHeight);

  const bool hasSameWidthSpec = lastWidthMode == widthMode &&
      yoga::inexactEquals(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode &&
      yoga::inexactEquals(effectiveLastHeight, effectiveHeight);

  const float adjustedWidth = availableWidth - marginRow;
  const float adjustedHeight = availableHeight - marginColumn;

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      sizeIsExactAndMatchesOldMeasuredSize(
          widthMode, adjustedWidth, lastComputedWidth) ||
      oldSizeIsMaxContentAndStillFits(
          widthMode, adjustedWidth, lastWidthMode, lastComputedWidth) ||
      newSizeIsStricterAndStillValid(
          widthMode, adjustedWidth, lastWidthMode, lastAvailableWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec ||
      sizeIsExactAndMatchesOldMeasuredSize(
          heightMode, adjustedHeight, lastComputedHeight) ||
      oldSizeIsMaxContentAndStillFits(
          heightMode, adjustedHeight, lastHeightMode, lastComputedHeight) ||
      newSizeIsStricterAndStillValid(
          heightMode, adjustedHeight, lastHeightMode, lastAvailableHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

} // namespace facebook::yoga
