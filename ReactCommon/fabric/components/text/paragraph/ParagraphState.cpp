/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphState.h"

#include <react/components/text/conversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

AttributedString ParagraphState::getAttributedString() const {
  return attributedString_;
}

void ParagraphState::setAttributedString(const AttributedString &attributedString) const {
  assert(!attributedStringIsInitialized_);
  attributedString_ = attributedString;
  attributedStringIsInitialized_ = true;
}

SharedTextLayoutManager ParagraphState::getTextLayoutManager() const {
  return textLayoutManager_;
}

void ParagraphState::setTextLayoutManager(const SharedTextLayoutManager &textLayoutManager) const {
  textLayoutManager_ = textLayoutManager;
}

#ifdef ANDROID

folly::dynamic ParagraphState::getDynamic() const {
  return toDynamic(*this);
}

#endif

} // namespace react
} // namespace facebook
