/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphLayoutManager.h"
#include <folly/Hash.h>
#include <react/renderer/core/CoreFeatures.h>

namespace facebook::react {

TextMeasurement ParagraphLayoutManager::measure(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  if (CoreFeatures::cacheNSTextStorage) {
    size_t newHash = folly::hash::hash_combine(
        0,
        textAttributedStringHashLayoutWise(attributedString),
        paragraphAttributes);

    if (!hostTextStorage_ || newHash != hash_) {
      hostTextStorage_ = textLayoutManager_->getHostTextStorage(
          attributedString, paragraphAttributes, layoutConstraints);
      hash_ = newHash;
    }
  }

  return textLayoutManager_->measure(
      AttributedStringBox(attributedString),
      paragraphAttributes,
      layoutConstraints,
      hostTextStorage_);
}

LinesMeasurements ParagraphLayoutManager::measureLines(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    Size size) const {
  return textLayoutManager_->measureLines(
      attributedString, paragraphAttributes, size);
}

void ParagraphLayoutManager::setTextLayoutManager(
    std::shared_ptr<TextLayoutManager const> textLayoutManager) const {
  textLayoutManager_ = std::move(textLayoutManager);
}

std::shared_ptr<TextLayoutManager const>
ParagraphLayoutManager::getTextLayoutManager() const {
  return textLayoutManager_;
}

std::shared_ptr<void> ParagraphLayoutManager::getHostTextStorage() const {
  return hostTextStorage_;
}
} // namespace facebook::react
