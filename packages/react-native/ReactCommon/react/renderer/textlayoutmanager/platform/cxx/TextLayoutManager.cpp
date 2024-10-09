/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

namespace facebook::react {

void* TextLayoutManager::getNativeTextLayoutManager() const {
  return (void*)this;
}

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

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t /*cacheId*/,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const LayoutConstraints& /*layoutConstraints*/) const {
  return {};
}

LinesMeasurements TextLayoutManager::measureLines(
    const AttributedStringBox& /*attributedStringBox*/,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const Size& /*size*/) const {
  return {};
};

Float TextLayoutManager::baseline(
    const AttributedStringBox& /*attributedStringBox*/,
    const ParagraphAttributes& /*paragraphAttributes*/,
    const Size& /*size*/) const {
  return 0;
}

} // namespace facebook::react
