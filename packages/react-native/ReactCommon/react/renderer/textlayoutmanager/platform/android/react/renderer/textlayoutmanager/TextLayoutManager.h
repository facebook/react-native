/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class TextLayoutManager;

/*
 * Cross platform facade for Android-specific TextLayoutManager.
 */
class TextLayoutManager {
 public:
  TextLayoutManager(const ContextContainer::Shared& contextContainer);

  /*
   * Not copyable.
   */
  TextLayoutManager(const TextLayoutManager&) = delete;
  TextLayoutManager& operator=(const TextLayoutManager&) = delete;

  /*
   * Not movable.
   */
  TextLayoutManager(TextLayoutManager&&) = delete;
  TextLayoutManager& operator=(TextLayoutManager&&) = delete;

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const TextLayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const;

  /**
   * Measures an AttributedString on the platform, as identified by some
   * opaque cache ID.
   */
  TextMeasurement measureCachedSpannableById(
      int64_t cacheId,
      const ParagraphAttributes& paragraphAttributes,
      const LayoutConstraints& layoutConstraints) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const Size& size) const;

  /*
   * Calculates baseline of `attributedString` using native text rendering
   * infrastructure.
   */
  Float baseline(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const Size& size) const;

 private:
  TextMeasurement doMeasure(
      const AttributedString& attributedString,
      const ParagraphAttributes& paragraphAttributes,
      const LayoutConstraints& layoutConstraints) const;

  ContextContainer::Shared contextContainer_;
  TextMeasureCache textMeasureCache_;
  LineMeasureCache lineMeasureCache_;
};

} // namespace facebook::react
