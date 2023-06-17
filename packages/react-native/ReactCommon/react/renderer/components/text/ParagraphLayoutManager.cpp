/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphLayoutManager.h"
#include <folly/Hash.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

TextMeasurement ParagraphLayoutManager::measure(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  if (CoreFeatures::cacheLastTextMeasurement) {
    bool shouldMeasure = shoudMeasureString(
        attributedString, paragraphAttributes, layoutConstraints);

    if (shouldMeasure) {
      cachedTextMeasurement_ = textLayoutManager_->measure(
          AttributedStringBox(attributedString),
          paragraphAttributes,
          layoutConstraints,
          hostTextStorage_);
      lastAvailableWidth_ = layoutConstraints.maximumSize.width;
    }

    return cachedTextMeasurement_;
  } else {
    return textLayoutManager_->measure(
        AttributedStringBox(attributedString),
        paragraphAttributes,
        layoutConstraints,
        nullptr);
  }
}

bool ParagraphLayoutManager::shoudMeasureString(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  size_t newHash = folly::hash::hash_combine(
      0,
      textAttributedStringHashLayoutWise(attributedString),
      paragraphAttributes);

  if (newHash != paragraphInputHash_) {
    // AttributedString or ParagraphAttributes have changed.
    // Must create new host text storage and trigger measure.
    hostTextStorage_ = textLayoutManager_->getHostTextStorage(
        attributedString, paragraphAttributes, layoutConstraints);
    paragraphInputHash_ = newHash;
    return true; // Must measure again.
  }

  bool hasMaximumSizeChanged =
      layoutConstraints.maximumSize.width != lastAvailableWidth_;
  Float threshold = 0.01f;
  bool doesMaximumSizeMatchLastMeasurement =
      std::abs(
          layoutConstraints.maximumSize.width -
          cachedTextMeasurement_.size.width) < threshold;
  if (hasMaximumSizeChanged && !doesMaximumSizeMatchLastMeasurement) {
    hostTextStorage_ = textLayoutManager_->getHostTextStorage(
        attributedString, paragraphAttributes, layoutConstraints);
    return true;
  }
  return false;
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
