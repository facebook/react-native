/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewLocalData.h"

#include <react/debug/debugStringConvertibleUtils.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

ScrollViewLocalData::ScrollViewLocalData(Rect contentBoundingRect)
    : contentBoundingRect(contentBoundingRect) {}

Size ScrollViewLocalData::getContentSize() const {
  return Size{contentBoundingRect.getMaxX(), contentBoundingRect.getMaxY()};
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ScrollViewLocalData::getDebugName() const {
  return "ScrollViewLocalData";
}

SharedDebugStringConvertibleList ScrollViewLocalData::getDebugProps() const {
  return {
      debugStringConvertibleItem("contentBoundingRect", contentBoundingRect)};
}
#endif

} // namespace react
} // namespace facebook
