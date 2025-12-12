/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <cstddef>

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

namespace facebook::react {

template <typename TextLayoutManagerT>
concept TextLayoutManagerWithPreparedLayout = requires(
    TextLayoutManagerT textLayoutManager,
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    TextLayoutContext layoutContext,
    LayoutConstraints layoutConstraints,
    typename TextLayoutManagerT::PreparedLayout preparedLayout) {
  sizeof(typename TextLayoutManagerT::PreparedLayout);
  {
    textLayoutManager.prepareLayout(attributedString, paragraphAttributes, layoutContext, layoutConstraints)
  } -> std::same_as<typename TextLayoutManagerT::PreparedLayout>;
  {
    textLayoutManager.measurePreparedLayout(preparedLayout, layoutContext, layoutConstraints)
  } -> std::same_as<TextMeasurement>;
};

namespace detail {
template <typename T>
struct PreparedLayoutT {
  using type = std::nullptr_t;
};

template <TextLayoutManagerWithPreparedLayout T>
struct PreparedLayoutT<T> {
  using type = typename T::PreparedLayout;
};

/**
 * TextLayoutManagerExtended acts as an adapter for TextLayoutManager methods
 * which may not exist for a specific platform. Callers can check at
 * compile-time whether a method is supported, and calling if it is not will
 * terminate.
 */
template <typename TextLayoutManagerT>
class TextLayoutManagerExtended {
 public:
  static constexpr bool supportsLineMeasurement()
  {
    return requires(TextLayoutManagerT textLayoutManager) {
      {
        textLayoutManager.measureLines(AttributedStringBox{}, ParagraphAttributes{}, Size{})
      } -> std::same_as<LinesMeasurements>;
    };
  }

  static constexpr bool supportsPreparedLayout()
  {
    return TextLayoutManagerWithPreparedLayout<TextLayoutManagerT>;
  }

  using PreparedLayout = typename PreparedLayoutT<TextLayoutManagerT>::type;

  TextLayoutManagerExtended(const TextLayoutManagerT &textLayoutManager) : textLayoutManager_(textLayoutManager) {}

  LinesMeasurements measureLines(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const Size &size)
  {
    if constexpr (supportsLineMeasurement()) {
      return textLayoutManager_.measureLines(attributedStringBox, paragraphAttributes, size);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support measureLines";
  }

  PreparedLayout prepareLayout(
      const AttributedString &attributedString,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const
  {
    if constexpr (supportsPreparedLayout()) {
      return textLayoutManager_.prepareLayout(attributedString, paragraphAttributes, layoutContext, layoutConstraints);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support prepareLayout";
  }

  TextMeasurement measurePreparedLayout(
      const PreparedLayout &layout,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const
  {
    if constexpr (supportsPreparedLayout()) {
      return textLayoutManager_.measurePreparedLayout(layout, layoutContext, layoutConstraints);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support measurePreparedLayout";
  }

 private:
  const TextLayoutManagerT &textLayoutManager_;
};
} // namespace detail

using TextLayoutManagerExtended = detail::TextLayoutManagerExtended<TextLayoutManager>;

struct MeasuredPreparedLayout {
  LayoutConstraints layoutConstraints;
  TextMeasurement measurement;
  TextLayoutManagerExtended::PreparedLayout preparedLayout{};
};

} // namespace facebook::react
