/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphLayoutManager.h"
#include <react/utils/CoreFeatures.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

TextMeasurement ParagraphLayoutManager::measure(
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
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
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  size_t newParagraphInputHash =
      hash_combine(attributedString, paragraphAttributes);

  if (newParagraphInputHash != paragraphInputHash_) {
    // AttributedString or ParagraphAttributes have changed.
    // Must create new host text storage and trigger measure.
    hostTextStorage_ = textLayoutManager_->getHostTextStorage(
        attributedString, paragraphAttributes, layoutConstraints);
    paragraphInputHash_ = newParagraphInputHash;

    return true; // Must measure again.
  }

  // Detect the case when available width for Paragraph meaningfully changes.
  // This is to prevent unnecessary re-creation of NSTextStorage on iOS.
  // On Android, this is no-op.
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
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    Size size) const {
  return textLayoutManager_->measureLines(
      attributedString, paragraphAttributes, size);
}

void ParagraphLayoutManager::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) const {
  textLayoutManager_ = std::move(textLayoutManager);
}

std::shared_ptr<const TextLayoutManager>
ParagraphLayoutManager::getTextLayoutManager() const {
  return textLayoutManager_;
}

std::shared_ptr<void> ParagraphLayoutManager::getHostTextStorage() const {
  return hostTextStorage_;
}
} // namespace facebook::react
