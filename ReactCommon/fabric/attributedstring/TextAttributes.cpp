/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextAttributes.h"

#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/graphics/graphicValuesConversions.h>

namespace facebook {
namespace react {

void TextAttributes::apply(TextAttributes textAttributes) {
  // Color
  foregroundColor = textAttributes.foregroundColor ? textAttributes.foregroundColor : foregroundColor;
  backgroundColor = textAttributes.backgroundColor ? textAttributes.backgroundColor : backgroundColor;
  opacity = !isnan(textAttributes.opacity) ? textAttributes.opacity : opacity;

  // Font
  fontFamily = !textAttributes.fontFamily.empty() ? textAttributes.fontFamily : fontFamily;
  fontSize = !isnan(textAttributes.fontSize) ? textAttributes.fontSize : fontSize;
  fontSizeMultiplier = !isnan(textAttributes.fontSizeMultiplier) ? textAttributes.fontSizeMultiplier : fontSizeMultiplier;
  fontWeight = textAttributes.fontWeight.has_value() ? textAttributes.fontWeight : fontWeight;
  fontStyle = textAttributes.fontStyle.has_value() ? textAttributes.fontStyle : fontStyle;
  fontVariant = textAttributes.fontVariant.has_value() ? textAttributes.fontVariant : fontVariant;
  allowFontScaling = textAttributes.allowFontScaling.has_value() ? textAttributes.allowFontScaling : allowFontScaling;
  letterSpacing = !isnan(textAttributes.letterSpacing) ? textAttributes.letterSpacing : letterSpacing;

  // Paragraph Styles
  lineHeight = !isnan(textAttributes.lineHeight) ? textAttributes.lineHeight : lineHeight;
  alignment = textAttributes.alignment.has_value() ? textAttributes.alignment : alignment;
  baseWritingDirection = textAttributes.baseWritingDirection.has_value() ? textAttributes.baseWritingDirection : baseWritingDirection;

  // Decoration
  textDecorationColor = textAttributes.textDecorationColor ? textAttributes.textDecorationColor : textDecorationColor;
  textDecorationLineType = textAttributes.textDecorationLineType.has_value() ? textAttributes.textDecorationLineType : textDecorationLineType;
  textDecorationLineStyle = textAttributes.textDecorationLineStyle.has_value() ? textAttributes.textDecorationLineStyle : textDecorationLineStyle;
  textDecorationLinePattern = textAttributes.textDecorationLinePattern.has_value() ? textAttributes.textDecorationLinePattern : textDecorationLinePattern;

  // Shadow
  textShadowOffset = textAttributes.textShadowOffset.has_value() ? textAttributes.textShadowOffset.value() : textShadowOffset;
  textShadowRadius = !isnan(textAttributes.textShadowRadius) ? textAttributes.textShadowRadius : textShadowRadius;
  textShadowColor = textAttributes.textShadowColor ? textAttributes.textShadowColor : textShadowColor;

  // Special
  isHighlighted = textAttributes.isHighlighted.has_value() ? textAttributes.isHighlighted : isHighlighted;
  layoutDirection = textAttributes.layoutDirection.has_value() ? textAttributes.layoutDirection : layoutDirection;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList TextAttributes::getDebugProps() const {
  TextAttributes defaultAttributes = {};

  SharedDebugStringConvertibleList list = {};

#define PROPS_ADD_TO_SET(propertyName, accessor, convertor) \
  if (propertyName != defaultAttributes.propertyName) { \
    list.push_back(std::make_shared<DebugStringConvertibleItem>(#propertyName, convertor(propertyName accessor))); \
  }

  PROPS_ADD_TO_SET(backgroundColor, , colorNameFromColor)
  PROPS_ADD_TO_SET(foregroundColor, , colorNameFromColor)
  PROPS_ADD_TO_SET(opacity, , std::to_string)

  PROPS_ADD_TO_SET(fontFamily, , )
  PROPS_ADD_TO_SET(fontSize, , std::to_string)
  PROPS_ADD_TO_SET(fontSizeMultiplier, , std::to_string)

  // TODO: Implement all fields.

  return list;
}

} // namespace react
} // namespace facebook
