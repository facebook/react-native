/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextAttributes.h"

#include <fabric/attributedstring/conversions.h>
#include <fabric/core/conversions.h>
#include <fabric/graphics/conversions.h>

#include <fabric/debug/debugStringConvertibleUtils.h>

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
  fontWeight = textAttributes.fontWeight.hasValue() ? textAttributes.fontWeight : fontWeight;
  fontStyle = textAttributes.fontStyle.hasValue() ? textAttributes.fontStyle : fontStyle;
  fontVariant = textAttributes.fontVariant.hasValue() ? textAttributes.fontVariant : fontVariant;
  allowFontScaling = textAttributes.allowFontScaling.hasValue() ? textAttributes.allowFontScaling : allowFontScaling;
  letterSpacing = !isnan(textAttributes.letterSpacing) ? textAttributes.letterSpacing : letterSpacing;

  // Paragraph Styles
  lineHeight = !isnan(textAttributes.lineHeight) ? textAttributes.lineHeight : lineHeight;
  alignment = textAttributes.alignment.hasValue() ? textAttributes.alignment : alignment;
  baseWritingDirection = textAttributes.baseWritingDirection.hasValue() ? textAttributes.baseWritingDirection : baseWritingDirection;

  // Decoration
  textDecorationColor = textAttributes.textDecorationColor ? textAttributes.textDecorationColor : textDecorationColor;
  textDecorationLineType = textAttributes.textDecorationLineType.hasValue() ? textAttributes.textDecorationLineType : textDecorationLineType;
  textDecorationLineStyle = textAttributes.textDecorationLineStyle.hasValue() ? textAttributes.textDecorationLineStyle : textDecorationLineStyle;
  textDecorationLinePattern = textAttributes.textDecorationLinePattern.hasValue() ? textAttributes.textDecorationLinePattern : textDecorationLinePattern;

  // Shadow
  textShadowOffset = textAttributes.textShadowOffset.hasValue() ? textAttributes.textShadowOffset.value() : textShadowOffset;
  textShadowRadius = !isnan(textAttributes.textShadowRadius) ? textAttributes.textShadowRadius : textShadowRadius;
  textShadowColor = textAttributes.textShadowColor ? textAttributes.textShadowColor : textShadowColor;

  // Special
  isHighlighted = textAttributes.isHighlighted.hasValue() ? textAttributes.isHighlighted : isHighlighted;
  layoutDirection = textAttributes.layoutDirection.hasValue() ? textAttributes.layoutDirection : layoutDirection;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList TextAttributes::getDebugProps() const {
  return {
    // Color
    debugStringConvertibleItem("backgroundColor", backgroundColor),
    debugStringConvertibleItem("foregroundColor", foregroundColor),
    debugStringConvertibleItem("opacity", opacity),

    // Font
    debugStringConvertibleItem("fontFamily", fontFamily),
    debugStringConvertibleItem("fontSize", fontSize),
    debugStringConvertibleItem("fontSizeMultiplier", fontSizeMultiplier),
    debugStringConvertibleItem("fontWeight", fontWeight),
    debugStringConvertibleItem("fontStyle", fontStyle),
    debugStringConvertibleItem("fontVariant", fontVariant),
    debugStringConvertibleItem("allowFontScaling", allowFontScaling),
    debugStringConvertibleItem("letterSpacing", letterSpacing),

    // Paragraph Styles
    debugStringConvertibleItem("lineHeight", lineHeight),
    debugStringConvertibleItem("alignment", alignment),
    debugStringConvertibleItem("baseWritingDirection", baseWritingDirection),

    // Decoration
    debugStringConvertibleItem("textDecorationColor", textDecorationColor),
    debugStringConvertibleItem("textDecorationLineType", textDecorationLineType),
    debugStringConvertibleItem("textDecorationLineStyle", textDecorationLineStyle),
    debugStringConvertibleItem("textDecorationLinePattern", textDecorationLinePattern),

    // Shadow
    debugStringConvertibleItem("textShadowOffset", textShadowOffset),
    debugStringConvertibleItem("textShadowRadius", textShadowRadius),
    debugStringConvertibleItem("textShadowColor", textShadowColor),

    // Special
    debugStringConvertibleItem("isHighlighted", isHighlighted),
    debugStringConvertibleItem("layoutDirection", layoutDirection),
  };
}

} // namespace react
} // namespace facebook
