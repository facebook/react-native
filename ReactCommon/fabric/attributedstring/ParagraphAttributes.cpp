/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphAttributes.h"

#include <fabric/attributedstring/textValuesConversions.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  ParagraphAttributes defaultParagraphAttributes = {};
  SharedDebugStringConvertibleList list = {};

#define PARAGRAPH_ATTRIBUTE(stringName, propertyName, accessor, convertor) \
  if (propertyName != defaultParagraphAttributes.propertyName) { \
    list.push_back(std::make_shared<DebugStringConvertibleItem>(#stringName, convertor(propertyName accessor))); \
  }

  PARAGRAPH_ATTRIBUTE(maximumNumberOfLines, maximumNumberOfLines, , std::to_string)
  PARAGRAPH_ATTRIBUTE(ellipsizeMode, ellipsizeMode, , stringFromEllipsizeMode)
  PARAGRAPH_ATTRIBUTE(adjustsFontSizeToFit, adjustsFontSizeToFit, , std::to_string)
  PARAGRAPH_ATTRIBUTE(minimumFontSize, minimumFontSize, , std::to_string)
  PARAGRAPH_ATTRIBUTE(maximumFontSize, maximumFontSize, , std::to_string)

  return list;
}

} // namespace react
} // namespace facebook
