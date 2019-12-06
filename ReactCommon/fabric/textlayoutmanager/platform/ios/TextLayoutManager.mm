/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <react/utils/ManagedObjectWrapper.h>

#import "RCTTextLayoutManager.h"

namespace facebook {
namespace react {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = (__bridge_retained void *)[RCTTextLayoutManager new];
}

TextLayoutManager::~TextLayoutManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

void *TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(self_ && "Stored NativeTextLayoutManager must not be null.");
  return self_;
}

Size TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const
{
  RCTTextLayoutManager *textLayoutManager = (__bridge RCTTextLayoutManager *)self_;

  auto size = Size{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto &attributedString = attributedStringBox.getValue();

      size = measureCache_.get(
          {attributedString, paragraphAttributes, layoutConstraints}, [&](TextMeasureCacheKey const &key) {
            return [textLayoutManager measureAttributedString:attributedString
                                          paragraphAttributes:paragraphAttributes
                                            layoutConstraints:layoutConstraints];
          });
      break;
    }

    case AttributedStringBox::Mode::OpaquePointer: {
      NSAttributedString *nsAttributedString =
          (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());

      size = [textLayoutManager measureNSAttributedString:nsAttributedString
                                      paragraphAttributes:paragraphAttributes
                                        layoutConstraints:layoutConstraints];
      break;
    }
  }

  return layoutConstraints.clamp(size);
}

} // namespace react
} // namespace facebook
