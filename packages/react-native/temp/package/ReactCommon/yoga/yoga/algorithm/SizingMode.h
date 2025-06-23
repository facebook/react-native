/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/MeasureMode.h>

namespace facebook::yoga {

/**
 * Corresponds to a CSS auto box sizes. Missing "min-content", as Yoga does not
 * current support automatic minimum sizes.
 * https://www.w3.org/TR/css-sizing-3/#auto-box-sizes
 * https://www.w3.org/TR/css-flexbox-1/#min-size-auto
 */
enum class SizingMode {
  /**
   * The size a box would take if its outer size filled the available space in
   * the given axis; in other words, the stretch fit into the available space,
   * if that is definite. Undefined if the available space is indefinite.
   */
  StretchFit,

  /**
   * A box’s “ideal” size in a given axis when given infinite available space.
   * Usually this is the smallest size the box could take in that axis while
   * still fitting around its contents, i.e. minimizing unfilled space while
   * avoiding overflow.
   */
  MaxContent,

  /**
   * If the available space in a given axis is definite, equal to
   * clamp(min-content size, stretch-fit size, max-content size) (i.e.
   * max(min-content size, min(max-content size, stretch-fit size))). When
   * sizing under a min-content constraint, equal to the min-content size.
   * Otherwise, equal to the max-content size in that axis.
   */
  FitContent,
};

inline MeasureMode measureMode(SizingMode mode) {
  switch (mode) {
    case SizingMode::StretchFit:
      return MeasureMode::Exactly;
    case SizingMode::MaxContent:
      return MeasureMode::Undefined;
    case SizingMode::FitContent:
      return MeasureMode::AtMost;
  }

  fatalWithMessage("Invalid SizingMode");
}

inline SizingMode sizingMode(MeasureMode mode) {
  switch (mode) {
    case MeasureMode::Exactly:
      return SizingMode::StretchFit;
    case MeasureMode::Undefined:
      return SizingMode::MaxContent;
    case MeasureMode::AtMost:
      return SizingMode::FitContent;
  }

  fatalWithMessage("Invalid MeasureMode");
}

} // namespace facebook::yoga
