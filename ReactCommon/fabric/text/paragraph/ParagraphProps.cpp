/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphProps.h"

#include <fabric/attributedstring/conversions.h>
#include <fabric/core/propsConversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

static ParagraphAttributes convertRawProp(const RawProps &rawProps, const ParagraphAttributes &defaultParagraphAttributes) {
  ParagraphAttributes paragraphAttributes;

  paragraphAttributes.maximumNumberOfLines = convertRawProp(rawProps, "numberOfLines", defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(rawProps, "ellipsizeMode", defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(rawProps, "adjustsFontSizeToFit", defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(rawProps, "minimumFontSize", defaultParagraphAttributes.minimumFontSize);
  paragraphAttributes.maximumFontSize = convertRawProp(rawProps, "maximumFontSize", defaultParagraphAttributes.maximumFontSize);

  return paragraphAttributes;
}

ParagraphProps::ParagraphProps(const ParagraphProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  BaseTextProps(sourceProps, rawProps),
  paragraphAttributes(convertRawProp(rawProps, sourceProps.paragraphAttributes)),
  isSelectable(convertRawProp(rawProps, "selectable", sourceProps.isSelectable)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return
    ViewProps::getDebugProps() +
    BaseTextProps::getDebugProps() +
    paragraphAttributes.getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("isSelectable", isSelectable)
    };
}

} // namespace react
} // namespace facebook
