/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextProps.h"

#include <fabric/attributedstring/textValuesConversions.h>
#include <fabric/core/propsConversions.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/graphics/graphicValuesConversions.h>
#include <fabric/text/propsConversions.h>

namespace facebook {
namespace react {

void BaseTextProps::apply(const RawProps &rawProps) {
  // Color
  applyRawProp(rawProps, "color", textAttributes_.foregroundColor);
  applyRawProp(rawProps, "backgroundColor", textAttributes_.backgroundColor);
  applyRawProp(rawProps, "opacity", textAttributes_.opacity);

  // Font
  applyRawProp(rawProps, "fontFamily", textAttributes_.fontFamily);
  applyRawProp(rawProps, "fontSize", textAttributes_.fontSize);
  applyRawProp(rawProps, "fontSizeMultiplier", textAttributes_.fontSizeMultiplier);
  applyRawProp(rawProps, "fontWeight", textAttributes_.fontWeight);
  applyRawProp(rawProps, "fontStyle", textAttributes_.fontStyle);
  applyRawProp(rawProps, "fontVariant", textAttributes_.fontVariant);
  applyRawProp(rawProps, "allowFontScaling", textAttributes_.allowFontScaling);
  applyRawProp(rawProps, "letterSpacing", textAttributes_.letterSpacing);

  // Paragraph
  applyRawProp(rawProps, "lineHeight", textAttributes_.lineHeight);
  applyRawProp(rawProps, "alignment", textAttributes_.alignment);
  applyRawProp(rawProps, "baseWritingDirection", textAttributes_.baseWritingDirection);

  // Decoration
  applyRawProp(rawProps, "textDecorationColor", textAttributes_.textDecorationColor);
  applyRawProp(rawProps, "textDecorationLineType", textAttributes_.textDecorationLineType);
  applyRawProp(rawProps, "textDecorationLineStyle", textAttributes_.textDecorationLineStyle);
  applyRawProp(rawProps, "textDecorationLinePattern", textAttributes_.textDecorationLinePattern);

  // Shadow
  applyRawProp(rawProps, "textShadowOffset", textAttributes_.textShadowOffset);
  applyRawProp(rawProps, "textShadowRadius", textAttributes_.textShadowRadius);
  applyRawProp(rawProps, "textShadowColor", textAttributes_.textShadowColor);

  // Special
  applyRawProp(rawProps, "isHighlighted", textAttributes_.isHighlighted);
}

#pragma mark - Getters

TextAttributes BaseTextProps::getTextAttributes() const {
  return textAttributes_;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes_.getDebugProps();
}

} // namespace react
} // namespace facebook
