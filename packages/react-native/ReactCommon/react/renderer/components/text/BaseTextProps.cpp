/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextProps.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>

namespace facebook::react {

static TextAttributes convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const TextAttributes& sourceTextAttributes,
    const TextAttributes& defaultTextAttributes) {
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
  textAttributes.dynamicTypeRamp = convertRawProp(
      context,
      rawProps,
      "dynamicTypeRamp",
      sourceTextAttributes.dynamicTypeRamp,
      defaultTextAttributes.dynamicTypeRamp);
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
  textAttributes.textAlignVertical = convertRawProp(
      context,
      rawProps,
      "textAlignVertical",
      sourceTextAttributes.textAlignVertical,
      defaultTextAttributes.textAlignVertical);

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
  textAttributes.lineBreakStrategy = convertRawProp(
      context,
      rawProps,
      "lineBreakStrategyIOS",
      sourceTextAttributes.lineBreakStrategy,
      defaultTextAttributes.lineBreakStrategy);
  textAttributes.lineBreakMode = convertRawProp(
      context,
      rawProps,
      "lineBreakModeIOS",
      sourceTextAttributes.lineBreakMode,
      defaultTextAttributes.lineBreakMode);

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
  textAttributes.isPressable = convertRawProp(
      context,
      rawProps,
      "isPressable",
      sourceTextAttributes.isPressable,
      defaultTextAttributes.isPressable);

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

  textAttributes.role = convertRawProp(
      context,
      rawProps,
      "role",
      sourceTextAttributes.role,
      defaultTextAttributes.role);

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
    const PropsParserContext& context,
    const BaseTextProps& sourceProps,
    const RawProps& rawProps)
    : textAttributes(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.textAttributes
              : convertRawProp(
                    context,
                    rawProps,
                    sourceProps.textAttributes,
                    TextAttributes{})){};

void BaseTextProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  static auto defaults = TextAttributes{};

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, foregroundColor, "color");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontFamily, "fontFamily");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontSize, "fontSize");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        fontSizeMultiplier,
        "fontSizeMultiplier");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontWeight, "fontWeight");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontStyle, "fontStyle");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontVariant, "fontVariant");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, allowFontScaling, "allowFontScaling");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, letterSpacing, "letterSpacing");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textTransform, "textTransform");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, lineHeight, "lineHeight");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, alignment, "textAlign");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textAlignVertical,
        "textAlignVertical");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        baseWritingDirection,
        "baseWritingDirection");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        lineBreakStrategy,
        "lineBreakStrategyIOS");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, lineBreakMode, "lineBreakModeIOS");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationColor,
        "textDecorationColor");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationLineType,
        "textDecorationLine");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationStyle,
        "textDecorationStyle");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowOffset, "textShadowOffset");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowRadius, "textShadowRadius");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowColor, "textShadowColor");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, isHighlighted, "isHighlighted");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, isPressable, "isPressable");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        accessibilityRole,
        "accessibilityRole");
    REBUILD_FIELD_SWITCH_CASE(defaults, value, textAttributes, role, "role");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, opacity, "opacity");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, backgroundColor, "backgroundColor");
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes.getDebugProps();
}
#endif

} // namespace facebook::react
