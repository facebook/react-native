/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

namespace facebook::react {

TextLayoutManager::TextLayoutManager(
    const ContextContainer::Shared& /*contextContainer*/)
    : textMeasureCache_(kSimpleThreadSafeCacheSizeCap),
      lineMeasureCache_(kSimpleThreadSafeCacheSizeCap) {}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const TextLayoutContext& /*layoutContext*/,
    const LayoutConstraints& /*layoutConstraints*/) const {
  TextMeasurement::Attachments attachments;
  for (const auto& fragment : attributedStringBox.getValue().getFragments()) {
    if (fragment.isAttachment()) {
      attachments.push_back(
          TextMeasurement::Attachment{{{0, 0}, {0, 0}}, false});
    }
  }
  return TextMeasurement{{0, 0}, attachments};
}

#ifdef ANDROID
TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t /*cacheId*/,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const LayoutConstraints& /*layoutConstraints*/) const {
  return {};
}
#endif

LinesMeasurements TextLayoutManager::measureLines(
    const AttributedStringBox& /*attributedStringBox*/,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const Size& /*size*/) const {
  return {};
};

} // namespace facebook::react
