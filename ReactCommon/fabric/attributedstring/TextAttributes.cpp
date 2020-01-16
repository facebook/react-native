/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextAttributes.h"

#include <react/attributedstring/conversions.h>
#include <react/core/conversions.h>
#include <react/graphics/conversions.h>
#include <react/utils/FloatComparison.h>
#include <cmath>

#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

void TextAttributes::apply(TextAttributes textAttributes) {
  // Color
  foregroundColor = textAttributes.foregroundColor
      ? textAttributes.foregroundColor
      : foregroundColor;
  backgroundColor = textAttributes.backgroundColor
      ? textAttributes.backgroundColor
      : backgroundColor;
  opacity =
      !std::isnan(textAttributes.opacity) ? textAttributes.opacity : opacity;

  // Font
  fontFamily = !textAttributes.fontFamily.empty() ? textAttributes.fontFamily
                                                  : fontFamily;
  fontSize =
      !std::isnan(textAttributes.fontSize) ? textAttributes.fontSize : fontSize;
  fontSizeMultiplier = !std::isnan(textAttributes.fontSizeMultiplier)
      ? textAttributes.fontSizeMultiplier
      : fontSizeMultiplier;
  fontWeight = textAttributes.fontWeight.hasValue() ? textAttributes.fontWeight
                                                    : fontWeight;
  fontStyle = textAttributes.fontStyle.hasValue() ? textAttributes.fontStyle
                                                  : fontStyle;
  fontVariant = textAttributes.fontVariant.hasValue()
      ? textAttributes.fontVariant
      : fontVariant;
  allowFontScaling = textAttributes.allowFontScaling.hasValue()
      ? textAttributes.allowFontScaling
      : allowFontScaling;
  letterSpacing = !std::isnan(textAttributes.letterSpacing)
      ? textAttributes.letterSpacing
      : letterSpacing;

  // Paragraph Styles
  lineHeight = !std::isnan(textAttributes.lineHeight)
      ? textAttributes.lineHeight
      : lineHeight;
  alignment = textAttributes.alignment.hasValue() ? textAttributes.alignment
                                                  : alignment;
  baseWritingDirection = textAttributes.baseWritingDirection.hasValue()
      ? textAttributes.baseWritingDirection
      : baseWritingDirection;

  // Decoration
  textDecorationColor = textAttributes.textDecorationColor
      ? textAttributes.textDecorationColor
      : textDecorationColor;
  textDecorationLineType = textAttributes.textDecorationLineType.hasValue()
      ? textAttributes.textDecorationLineType
      : textDecorationLineType;
  textDecorationLineStyle = textAttributes.textDecorationLineStyle.hasValue()
      ? textAttributes.textDecorationLineStyle
      : textDecorationLineStyle;
  textDecorationLinePattern =
      textAttributes.textDecorationLinePattern.hasValue()
      ? textAttributes.textDecorationLinePattern
      : textDecorationLinePattern;

  // Shadow
  textShadowOffset = textAttributes.textShadowOffset.hasValue()
      ? textAttributes.textShadowOffset.value()
      : textShadowOffset;
  textShadowRadius = !std::isnan(textAttributes.textShadowRadius)
      ? textAttributes.textShadowRadius
      : textShadowRadius;
  textShadowColor = textAttributes.textShadowColor
      ? textAttributes.textShadowColor
      : textShadowColor;

  // Special
  isHighlighted = textAttributes.isHighlighted.hasValue()
      ? textAttributes.isHighlighted
      : isHighlighted;
  layoutDirection = textAttributes.layoutDirection.hasValue()
      ? textAttributes.layoutDirection
      : layoutDirection;
}

#pragma mark - Operators

bool TextAttributes::operator==(const TextAttributes &rhs) const {
  return std::tie(
             foregroundColor,
             backgroundColor,
             fontFamily,
             fontWeight,
             fontStyle,
             fontVariant,
             allowFontScaling,
             alignment,
             baseWritingDirection,
             textDecorationColor,
             textDecorationLineType,
             textDecorationLineStyle,
             textDecorationLinePattern,
             textShadowOffset,
             textShadowColor,
             isHighlighted,
             layoutDirection) ==
      std::tie(
             rhs.foregroundColor,
             rhs.backgroundColor,
             rhs.fontFamily,
             rhs.fontWeight,
             rhs.fontStyle,
             rhs.fontVariant,
             rhs.allowFontScaling,
             rhs.alignment,
             rhs.baseWritingDirection,
             rhs.textDecorationColor,
             rhs.textDecorationLineType,
             rhs.textDecorationLineStyle,
             rhs.textDecorationLinePattern,
             rhs.textShadowOffset,
             rhs.textShadowColor,
             rhs.isHighlighted,
             rhs.layoutDirection) &&
      floatEquality(opacity, rhs.opacity) &&
      floatEquality(fontSize, rhs.fontSize) &&
      floatEquality(fontSizeMultiplier, rhs.fontSizeMultiplier) &&
      floatEquality(letterSpacing, rhs.letterSpacing) &&
      floatEquality(lineHeight, rhs.lineHeight) &&
      floatEquality(textShadowRadius, rhs.textShadowRadius);
}

bool TextAttributes::operator!=(const TextAttributes &rhs) const {
  return !(*this == rhs);
}

TextAttributes TextAttributes::defaultTextAttributes() {
  static auto textAttributes = [] {
    auto textAttributes = TextAttributes{};
    // Non-obvious (can be different among platforms) default text attributes.
    textAttributes.foregroundColor = blackColor();
    textAttributes.backgroundColor = clearColor();
    textAttributes.fontSize = 14.0;
    textAttributes.fontSizeMultiplier = 1.0;
    return textAttributes;
  }();
  return textAttributes;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
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
      debugStringConvertibleItem(
          "textDecorationLineType", textDecorationLineType),
      debugStringConvertibleItem(
          "textDecorationLineStyle", textDecorationLineStyle),
      debugStringConvertibleItem(
          "textDecorationLinePattern", textDecorationLinePattern),

      // Shadow
      debugStringConvertibleItem("textShadowOffset", textShadowOffset),
      debugStringConvertibleItem("textShadowRadius", textShadowRadius),
      debugStringConvertibleItem("textShadowColor", textShadowColor),

      // Special
      debugStringConvertibleItem("isHighlighted", isHighlighted),
      debugStringConvertibleItem("layoutDirection", layoutDirection),
  };
}
#endif

} // namespace react
} // namespace facebook
