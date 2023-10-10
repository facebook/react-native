/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

/*
 * Serves as a middle man between `ParagraphShadowNode` and `TextLayoutManager`.
 * On iOS, caches `NSTextStorage` for individual `ParagraphShadowNode` to make
 * sure only one `NSTextStorage` is created for every string. `NSTextStorage`
 * can be re created on native views layer but it is expensive. On Android, this
 * class does not cache anything.
 */
class ParagraphLayoutManager {
 public:
  TextMeasurement measure(
      const AttributedString& attributedString,
      const ParagraphAttributes& paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  LinesMeasurements measureLines(
      const AttributedString& attributedString,
      const ParagraphAttributes& paragraphAttributes,
      Size size) const;

  void setTextLayoutManager(
      std::shared_ptr<const TextLayoutManager> textLayoutManager) const;

  /*
   * Returns an opaque pointer to platform-specific `TextLayoutManager`.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  std::shared_ptr<const TextLayoutManager> getTextLayoutManager() const;

  /*
   * Returns opaque shared_ptr holding `NSTextStorage`.
   * May be nullptr.
   * Is used on a native views layer to prevent `NSTextStorage` from being
   * created twice.
   */
  std::shared_ptr<void> getHostTextStorage() const;

 private:
  std::shared_ptr<const TextLayoutManager> mutable textLayoutManager_{};

  /*
   * Stores opaque pointer to `NSTextStorage` on iOS. nullptr on Android.
   * TODO: In the future, we may want to cache Android's text storage.
   */
  std::shared_ptr<void> mutable hostTextStorage_{};

  /*
   * Hash of AttributedString and ParagraphAttributes last used to
   * measure. Result of that measure is stored in cachedTextMeasurement_.
   * The available width defined for the measurement is stored in
   * lastAvailableWidth_.
   */
  size_t mutable paragraphInputHash_{};

  /* The width Yoga set as maximum width.
   * Yoga calls measure twice with two
   * different maximum width. One of available space.
   * The other one is exact space needed for the string.
   * This happens when node is dirtied but its size is not affected.
   * To deal with this inefficiency, we cache `TextMeasurement` for each
   * `ParagraphShadowNode`. If Yoga tries to re-measure with available width
   * or exact width, we provide it with the cached value.
   */
  Float mutable lastAvailableWidth_{};
  TextMeasurement mutable cachedTextMeasurement_{};

  /*
   * Checks whether the inputs into text measurement meaningfully affect
   * text measurement result. Returns true if inputs have changed and measure is
   * needed.
   */
  bool shoudMeasureString(
      const AttributedString& attributedString,
      const ParagraphAttributes& paragraphAttributes,
      LayoutConstraints layoutConstraints) const;
};
} // namespace facebook::react
