/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "TextLayoutManager.h"
#import "RCTTextLayoutManager.h"

#import <react/renderer/telemetry/TransactionTelemetry.h>
#import <react/utils/ManagedObjectWrapper.h>

namespace facebook::react {

TextLayoutManager::TextLayoutManager(const ContextContainer::Shared &contextContainer)
{
  nativeTextLayoutManager_ = wrapManagedObject([RCTTextLayoutManager new]);
}

std::shared_ptr<void> TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(nativeTextLayoutManager_ && "Stored NativeTextLayoutManager must not be null.");
  return nativeTextLayoutManager_;
}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox &attributedStringBox,
    const ParagraphAttributes &paragraphAttributes,
    const TextLayoutContext &layoutContext,
    const LayoutConstraints &layoutConstraints) const
{
  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(nativeTextLayoutManager_);

  auto measurement = TextMeasurement{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto &attributedString = attributedStringBox.getValue();

      measurement = textMeasureCache_.get(
          {attributedString, paragraphAttributes, layoutConstraints}, [&](const TextMeasureCacheKey &key) {
            auto telemetry = TransactionTelemetry::threadLocalTelemetry();
            if (telemetry) {
              telemetry->willMeasureText();
            }

            auto measurement = [textLayoutManager measureAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                            layoutContext:layoutContext
                                                        layoutConstraints:layoutConstraints];

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
                                                   layoutContext:layoutContext
                                               layoutConstraints:layoutConstraints];

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
    const AttributedStringBox &attributedStringBox,
    const ParagraphAttributes &paragraphAttributes,
    const Size &size) const
{
  react_native_assert(attributedStringBox.getMode() == AttributedStringBox::Mode::Value);
  const auto &attributedString = attributedStringBox.getValue();

  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(nativeTextLayoutManager_);

  auto measurement =
      lineMeasureCache_.get({attributedString, paragraphAttributes, size}, [&](const LineMeasureCacheKey &key) {
        auto measurement = [textLayoutManager getLinesForAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                                     size:{size.width, size.height}];
        return measurement;
      });

  return measurement;
}

} // namespace facebook::react
