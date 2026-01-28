/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/jni/SafeReleaseJniRef.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/textlayoutmanager/JPreparedLayout.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/ContextContainer.h>

#include <fbjni/fbjni.h>
#include <memory>

namespace facebook::react {

class TextLayoutManager;

/*
 * Cross platform facade for text measurement (e.g. Android-specific
 * TextLayoutManager)
 */
class TextLayoutManager {
 public:
  using PreparedLayout = SafeReleaseJniRef<jni::global_ref<JPreparedLayout>>;

  TextLayoutManager(const std::shared_ptr<const ContextContainer> &contextContainer);

  /*
   * Not copyable.
   */
  TextLayoutManager(const TextLayoutManager &) = delete;
  TextLayoutManager &operator=(const TextLayoutManager &) = delete;

  /*
   * Not movable.
   */
  TextLayoutManager(TextLayoutManager &&) = delete;
  TextLayoutManager &operator=(TextLayoutManager &&) = delete;

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /**
   * Measures an AttributedString on the platform, as identified by some
   * opaque cache ID.
   */
  TextMeasurement measureCachedSpannableById(
      int64_t cacheId,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const Size &size) const;

  /**
   * Create a platform representation of fully laid out text, to later be
   * reused.
   */
  PreparedLayout prepareLayout(
      const AttributedString &attributedString,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /**
   * Derive text and attachment measurements from a PreparedLayout.
   */
  TextMeasurement measurePreparedLayout(
      const PreparedLayout &layout,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /**
   * Get the bounding rects of all text fragments that belong to the given
   * react tag within a PreparedLayout. This is useful for getting the visual
   * boundaries of nested <Text> components within a text paragraph.
   */
  std::vector<Rect> getFragmentRectsForReactTag(const PreparedLayout &layout, Tag targetReactTag) const;

  /**
   * Get the bounding rects of all text fragments that belong to the given
   * react tag by creating a layout on-demand from the AttributedString.
   * This is used as a fallback when PreparedLayout is not available
   * (e.g., when enablePreparedTextLayout feature flag is disabled).
   */
  std::vector<Rect> getFragmentRectsFromAttributedString(
      Tag surfaceId,
      const AttributedString &attributedString,
      const ParagraphAttributes &paragraphAttributes,
      const LayoutConstraints &layoutConstraints,
      Tag targetReactTag) const;

 private:
  std::shared_ptr<const ContextContainer> contextContainer_;
  TextMeasureCache textMeasureCache_;
  LineMeasureCache lineMeasureCache_;
  SimpleThreadSafeCache<PreparedTextCacheKey, PreparedLayout, -1 /* Set dynamically*/> preparedTextCache_;
};

} // namespace facebook::react
