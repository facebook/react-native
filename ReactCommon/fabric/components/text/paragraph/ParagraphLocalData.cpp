/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphLocalData.h"

#include <react/components/text/conversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

AttributedString ParagraphLocalData::getAttributedString() const {
  return attributedString_;
}

void ParagraphLocalData::setAttributedString(
    AttributedString attributedString) {
  ensureUnsealed();
  attributedString_ = attributedString;
}

SharedTextLayoutManager ParagraphLocalData::getTextLayoutManager() const {
  return textLayoutManager_;
}

void ParagraphLocalData::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

#ifdef ANDROID

folly::dynamic ParagraphLocalData::getDynamic() const {
  return toDynamic(*this);
}

#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ParagraphLocalData::getDebugName() const {
  return "ParagraphLocalData";
}

SharedDebugStringConvertibleList ParagraphLocalData::getDebugProps() const {
  return {
      debugStringConvertibleItem("attributedString", attributedString_, "")};
}
#endif

} // namespace react
} // namespace facebook
