/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/StyleSizeLength.h>
#include <vector>

namespace facebook::yoga {
// https://www.w3.org/TR/css-grid-1/#typedef-track-size
struct GridTrackSize {
  StyleSizeLength minSizingFunction;
  StyleSizeLength maxSizingFunction;

  // These are used in the grid layout algorithm when distributing spaces among
  // tracks
  // TODO: maybe move them to TrackSizing since these are track states
  float baseSize = 0.0f;
  float growthLimit = 0.0f;
  bool infinitelyGrowable = false;

  // Static factory methods for common cases
  static GridTrackSize auto_() {
    return GridTrackSize{StyleSizeLength::ofAuto(), StyleSizeLength::ofAuto()};
  }

  static GridTrackSize length(float points) {
    auto len = StyleSizeLength::points(points);
    return GridTrackSize{len, len};
  }

  static GridTrackSize fr(float fraction) {
    // Flex sizing function is always a max sizing function
    return GridTrackSize{
        StyleSizeLength::ofAuto(), StyleSizeLength::stretch(fraction)};
  }

  static GridTrackSize percent(float percentage) {
    return GridTrackSize{
        StyleSizeLength::percent(percentage),
        StyleSizeLength::percent(percentage)};
  }

  static GridTrackSize minmax(StyleSizeLength min, StyleSizeLength max) {
    return GridTrackSize{min, max};
  }

  bool operator==(const GridTrackSize& other) const {
    return minSizingFunction == other.minSizingFunction &&
        maxSizingFunction == other.maxSizingFunction;
  }

  bool operator!=(const GridTrackSize& other) const {
    return !(*this == other);
  }
};

// Grid track list for grid-template-rows/columns properties
using GridTrackList = std::vector<GridTrackSize>;

} // namespace facebook::yoga
