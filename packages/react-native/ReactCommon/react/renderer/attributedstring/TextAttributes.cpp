/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextAttributes.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/utils/FloatComparison.h>
#include <cmath>

#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

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
  fontWeight = textAttributes.fontWeight.has_value() ? textAttributes.fontWeight
                                                     : fontWeight;
  fontStyle = textAttributes.fontStyle.has_value() ? textAttributes.fontStyle
                                                   : fontStyle;
  fontVariant = textAttributes.fontVariant.has_value()
      ? textAttributes.fontVariant
      : fontVariant;
  allowFontScaling = textAttributes.allowFontScaling.has_value()
      ? textAttributes.allowFontScaling
      : allowFontScaling;
  dynamicTypeRamp = textAttributes.dynamicTypeRamp.has_value()
      ? textAttributes.dynamicTypeRamp
      : dynamicTypeRamp;
  letterSpacing = !std::isnan(textAttributes.letterSpacing)
      ? textAttributes.letterSpacing
      : letterSpacing;
  textTransform = textAttributes.textTransform.has_value()
      ? textAttributes.textTransform
      : textTransform;

  // Paragraph Styles
  lineHeight = !std::isnan(textAttributes.lineHeight)
      ? textAttributes.lineHeight
      : lineHeight;
  alignment = textAttributes.alignment.has_value() ? textAttributes.alignment
                                                   : alignment;
  baseWritingDirection = textAttributes.baseWritingDirection.has_value()
      ? textAttributes.baseWritingDirection
      : baseWritingDirection;
  lineBreakStrategy = textAttributes.lineBreakStrategy.has_value()
      ? textAttributes.lineBreakStrategy
      : lineBreakStrategy;

  // Decoration
  textDecorationColor = textAttributes.textDecorationColor
      ? textAttributes.textDecorationColor
      : textDecorationColor;
  textDecorationLineType = textAttributes.textDecorationLineType.has_value()
      ? textAttributes.textDecorationLineType
      : textDecorationLineType;
  textDecorationStyle = textAttributes.textDecorationStyle.has_value()
      ? textAttributes.textDecorationStyle
      : textDecorationStyle;

  // Shadow
  textShadowOffset = textAttributes.textShadowOffset.has_value()
      ? textAttributes.textShadowOffset.value()
      : textShadowOffset;
  textShadowRadius = !std::isnan(textAttributes.textShadowRadius)
      ? textAttributes.textShadowRadius
      : textShadowRadius;
  textShadowColor = textAttributes.textShadowColor
      ? textAttributes.textShadowColor
      : textShadowColor;

  // Special
  isHighlighted = textAttributes.isHighlighted.has_value()
      ? textAttributes.isHighlighted
      : isHighlighted;
  layoutDirection = textAttributes.layoutDirection.has_value()
      ? textAttributes.layoutDirection
      : layoutDirection;
  accessibilityRole = textAttributes.accessibilityRole.has_value()
      ? textAttributes.accessibilityRole
      : accessibilityRole;
  role = textAttributes.role.has_value() ? textAttributes.role : role;
}

#pragma mark - Operators

bool TextAttributes::operator==(const TextAttributes& rhs) const {
  return std::tie(
             foregroundColor,
             backgroundColor,
             fontFamily,
             fontWeight,
             fontStyle,
             fontVariant,
             allowFontScaling,
             dynamicTypeRamp,
             alignment,
             baseWritingDirection,
             lineBreakStrategy,
             textDecorationColor,
             textDecorationLineType,
             textDecorationStyle,
             textShadowOffset,
             textShadowColor,
             isHighlighted,
             layoutDirection,
             accessibilityRole,
             role,
             textTransform) ==
      std::tie(
             rhs.foregroundColor,
             rhs.backgroundColor,
             rhs.fontFamily,
             rhs.fontWeight,
             rhs.fontStyle,
             rhs.fontVariant,
             rhs.allowFontScaling,
             rhs.dynamicTypeRamp,
             rhs.alignment,
             rhs.baseWritingDirection,
             rhs.lineBreakStrategy,
             rhs.textDecorationColor,
             rhs.textDecorationLineType,
             rhs.textDecorationStyle,
             rhs.textShadowOffset,
             rhs.textShadowColor,
             rhs.isHighlighted,
             rhs.layoutDirection,
             rhs.accessibilityRole,
             rhs.role,
             rhs.textTransform) &&
      floatEquality(opacity, rhs.opacity) &&
      floatEquality(fontSize, rhs.fontSize) &&
      floatEquality(fontSizeMultiplier, rhs.fontSizeMultiplier) &&
      floatEquality(letterSpacing, rhs.letterSpacing) &&
      floatEquality(lineHeight, rhs.lineHeight) &&
      floatEquality(textShadowRadius, rhs.textShadowRadius);
}

bool TextAttributes::operator!=(const TextAttributes& rhs) const {
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
      debugStringConvertibleItem("dynamicTypeRamp", dynamicTypeRamp),
      debugStringConvertibleItem("letterSpacing", letterSpacing),

      // Paragraph Styles
      debugStringConvertibleItem("lineHeight", lineHeight),
      debugStringConvertibleItem("alignment", alignment),
      debugStringConvertibleItem("baseWritingDirection", baseWritingDirection),
      debugStringConvertibleItem("lineBreakStrategyIOS", lineBreakStrategy),

      // Decoration
      debugStringConvertibleItem("textDecorationColor", textDecorationColor),
      debugStringConvertibleItem(
          "textDecorationLineType", textDecorationLineType),
      debugStringConvertibleItem("textDecorationStyle", textDecorationStyle),

      // Shadow
      debugStringConvertibleItem("textShadowOffset", textShadowOffset),
      debugStringConvertibleItem("textShadowRadius", textShadowRadius),
      debugStringConvertibleItem("textShadowColor", textShadowColor),

      // Special
      debugStringConvertibleItem("isHighlighted", isHighlighted),
      debugStringConvertibleItem("layoutDirection", layoutDirection),
      debugStringConvertibleItem("accessibilityRole", accessibilityRole),
      debugStringConvertibleItem("role", role),
  };
}
#endif

} // namespace facebook::react
