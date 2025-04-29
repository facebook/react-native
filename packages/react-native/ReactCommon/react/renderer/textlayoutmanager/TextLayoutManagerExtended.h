/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

namespace facebook::react {

namespace detail {
/**
 * TextLayoutManagerExtended acts as an adapter for TextLayoutManager methods
 * which may not exist for a specific platform. Callers can check at
 * compile-time whether a method is supported, and calling if it is not will
 * terminate.
 */
template <typename TextLayoutManagerT>
class TextLayoutManagerExtended {
 public:
  static constexpr bool supportsLineMeasurement() {
    return requires(TextLayoutManagerT textLayoutManager) {
      {
        textLayoutManager.measureLines(
            AttributedStringBox{}, ParagraphAttributes{}, Size{})
      } -> std::same_as<LinesMeasurements>;
    };
  }

  TextLayoutManagerExtended(const TextLayoutManagerT& textLayoutManager)
      : textLayoutManager_(textLayoutManager) {}

  LinesMeasurements measureLines(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const Size& size) {
    if constexpr (supportsLineMeasurement()) {
      return textLayoutManager_.measureLines(
          attributedStringBox, paragraphAttributes, size);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support measureLines";
  }

 private:
  const TextLayoutManagerT& textLayoutManager_;
};
} // namespace detail

using TextLayoutManagerExtended =
    detail::TextLayoutManagerExtended<TextLayoutManager>;

} // namespace facebook::react
