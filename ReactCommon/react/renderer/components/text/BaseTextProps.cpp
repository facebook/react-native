/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextProps.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

static TextAttributes convertRawProp(
    PropsParserContext const &context,
    RawProps const &rawProps,
    TextAttributes const &sourceTextAttributes,
    TextAttributes const &defaultTextAttributes) {
  auto textAttributes = TextAttributes{};

  // Color (not accessed by ViewProps)
  textAttributes.foregroundColor = convertRawProp(
      context,
      rawProps,
      "color",
      sourceTextAttributes.foregroundColor,
      defaultTextAttributes.foregroundColor);

  // Font
  textAttributes.fontFamily = convertRawProp(
      context,
      rawProps,
      "fontFamily",
      sourceTextAttributes.fontFamily,
      defaultTextAttributes.fontFamily);
  textAttributes.fontSize = convertRawProp(
      context,
      rawProps,
      "fontSize",
      sourceTextAttributes.fontSize,
      defaultTextAttributes.fontSize);
  textAttributes.fontSizeMultiplier = convertRawProp(
      context,
      rawProps,
      "fontSizeMultiplier",
      sourceTextAttributes.fontSizeMultiplier,
      defaultTextAttributes.fontSizeMultiplier);
  textAttributes.fontWeight = convertRawProp(
      context,
      rawProps,
      "fontWeight",
      sourceTextAttributes.fontWeight,
      defaultTextAttributes.fontWeight);
  textAttributes.fontStyle = convertRawProp(
      context,
      rawProps,
      "fontStyle",
      sourceTextAttributes.fontStyle,
      defaultTextAttributes.fontStyle);
  textAttributes.fontVariant = convertRawProp(
      context,
      rawProps,
      "fontVariant",
      sourceTextAttributes.fontVariant,
      defaultTextAttributes.fontVariant);
  textAttributes.allowFontScaling = convertRawProp(
      context,
      rawProps,
      "allowFontScaling",
      sourceTextAttributes.allowFontScaling,
      defaultTextAttributes.allowFontScaling);
  textAttributes.letterSpacing = convertRawProp(
      context,
      rawProps,
      "letterSpacing",
      sourceTextAttributes.letterSpacing,
      defaultTextAttributes.letterSpacing);
  textAttributes.textTransform = convertRawProp(
      context,
      rawProps,
      "textTransform",
      sourceTextAttributes.textTransform,
      defaultTextAttributes.textTransform);

  // Paragraph
  textAttributes.lineHeight = convertRawProp(
      context,
      rawProps,
      "lineHeight",
      sourceTextAttributes.lineHeight,
      defaultTextAttributes.lineHeight);
  textAttributes.alignment = convertRawProp(
      context,
      rawProps,
      "textAlign",
      sourceTextAttributes.alignment,
      defaultTextAttributes.alignment);
  textAttributes.baseWritingDirection = convertRawProp(
      context,
      rawProps,
      "baseWritingDirection",
      sourceTextAttributes.baseWritingDirection,
      defaultTextAttributes.baseWritingDirection);

  // Decoration
  textAttributes.textDecorationColor = convertRawProp(
      context,
      rawProps,
      "textDecorationColor",
      sourceTextAttributes.textDecorationColor,
      defaultTextAttributes.textDecorationColor);
  textAttributes.textDecorationLineType = convertRawProp(
      context,
      rawProps,
      "textDecorationLine",
      sourceTextAttributes.textDecorationLineType,
      defaultTextAttributes.textDecorationLineType);
  textAttributes.textDecorationStyle = convertRawProp(
      context,
      rawProps,
      "textDecorationStyle",
      sourceTextAttributes.textDecorationStyle,
      defaultTextAttributes.textDecorationStyle);

  // Shadow
  textAttributes.textShadowOffset = convertRawProp(
      context,
      rawProps,
      "textShadowOffset",
      sourceTextAttributes.textShadowOffset,
      defaultTextAttributes.textShadowOffset);
  textAttributes.textShadowRadius = convertRawProp(
      context,
      rawProps,
      "textShadowRadius",
      sourceTextAttributes.textShadowRadius,
      defaultTextAttributes.textShadowRadius);
  textAttributes.textShadowColor = convertRawProp(
      context,
      rawProps,
      "textShadowColor",
      sourceTextAttributes.textShadowColor,
      defaultTextAttributes.textShadowColor);

  // Special
  textAttributes.isHighlighted = convertRawProp(
      context,
      rawProps,
      "isHighlighted",
      sourceTextAttributes.isHighlighted,
      defaultTextAttributes.isHighlighted);

  // In general, we want this class to access props in the same order
  // that ViewProps accesses them in, so that RawPropParser can optimize
  // accesses. This is both theoretical, and ParagraphProps takes advantage
  // of this.
  // In particular: accessibilityRole, opacity, and backgroundColor also
  // are parsed first by ViewProps (and indirectly AccessibilityProps).
  // However, since RawPropsParser will always store these props /before/
  // the unique BaseTextProps props, it is most efficient to parse these, in
  // order, /after/ all of the other BaseTextProps, so that the RawPropsParser
  // index rolls over only once instead of twice.
  textAttributes.accessibilityRole = convertRawProp(
      context,
      rawProps,
      "accessibilityRole",
      sourceTextAttributes.accessibilityRole,
      defaultTextAttributes.accessibilityRole);

  // Color (accessed in this order by ViewProps)
  textAttributes.opacity = convertRawProp(
      context,
      rawProps,
      "opacity",
      sourceTextAttributes.opacity,
      defaultTextAttributes.opacity);
  textAttributes.backgroundColor = convertRawProp(
      context,
      rawProps,
      "backgroundColor",
      sourceTextAttributes.backgroundColor,
      defaultTextAttributes.backgroundColor);

  return textAttributes;
}

BaseTextProps::BaseTextProps(
    const PropsParserContext &context,
    const BaseTextProps &sourceProps,
    const RawProps &rawProps)
    : textAttributes(convertRawProp(
          context,
          rawProps,
          sourceProps.textAttributes,
          TextAttributes{})){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes.getDebugProps();
}
#endif

} // namespace react
} // namespace facebook
