/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/utils/ManagedObjectWrapper.h>

#import "RCTTextLayoutManager.h"

namespace facebook::react {

TextLayoutManager::TextLayoutManager(const ContextContainer::Shared &contextContainer)
{
  self_ = wrapManagedObject([RCTTextLayoutManager new]);
}

std::shared_ptr<void> TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(self_ && "Stored NativeTextLayoutManager must not be null.");
  return self_;
}

std::shared_ptr<void> TextLayoutManager::getHostTextStorage(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const
{
  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(self_);
  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width, CGFLOAT_MAX};

  NSTextStorage *textStorage = [textLayoutManager textStorageForAttributesString:attributedString
                                                             paragraphAttributes:paragraphAttributes
                                                                            size:maximumSize];
  return wrapManagedObject(textStorage);
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints,
    std::shared_ptr<void> hostTextStorage) const
{
  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(self_);
  NSTextStorage *textStorage;
  if (hostTextStorage) {
    textStorage = unwrapManagedObject(hostTextStorage);
  }

  auto measurement = TextMeasurement{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto &attributedString = attributedStringBox.getValue();

      measurement = measureCache_.get(
          {attributedString, paragraphAttributes, layoutConstraints}, [&](const TextMeasureCacheKey &key) {
            auto telemetry = TransactionTelemetry::threadLocalTelemetry();
            if (telemetry) {
              telemetry->willMeasureText();
            }

            auto measurement = [textLayoutManager measureAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                        layoutConstraints:layoutConstraints
                                                              textStorage:textStorage];

            if (telemetry) {
              telemetry->didMeasureText();
            }

            return measurement;
          });
      break;
    }

    case AttributedStringBox::Mode::OpaquePointer: {
      NSAttributedString *nsAttributedString =
          (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());

      auto telemetry = TransactionTelemetry::threadLocalTelemetry();
      if (telemetry) {
        telemetry->willMeasureText();
      }

      measurement = [textLayoutManager measureNSAttributedString:nsAttributedString
                                             paragraphAttributes:paragraphAttributes
                                               layoutConstraints:layoutConstraints
                                                     textStorage:textStorage];

      if (telemetry) {
        telemetry->didMeasureText();
      }

      break;
    }
  }

  measurement.size = layoutConstraints.clamp(measurement.size);

  return measurement;
}

LinesMeasurements TextLayoutManager::measureLines(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    Size size) const
{
  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(self_);
  return [textLayoutManager getLinesForAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                                   size:{size.width, size.height}];
}

} // namespace facebook::react
