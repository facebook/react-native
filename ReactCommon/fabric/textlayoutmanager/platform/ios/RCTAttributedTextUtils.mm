/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAttributedTextUtils.h"

#include <react/core/LayoutableShadowNode.h>
#include <react/textlayoutmanager/RCTFontProperties.h>
#include <react/textlayoutmanager/RCTFontUtils.h>
#include <react/textlayoutmanager/RCTTextPrimitivesConversions.h>

using namespace facebook::react;

@implementation RCTWeakEventEmitterWrapper {
  std::weak_ptr<const EventEmitter> _weakEventEmitter;
}

- (void)setEventEmitter:(SharedEventEmitter)eventEmitter {
  _weakEventEmitter = eventEmitter;
}

- (SharedEventEmitter)eventEmitter {
  return _weakEventEmitter.lock();
}

- (void)dealloc {
  _weakEventEmitter.reset();
}

@end

inline static UIFont *RCTEffectiveFontFromTextAttributes(
    const TextAttributes &textAttributes) {
  NSString *fontFamily =
      [NSString stringWithCString:textAttributes.fontFamily.c_str()
                         encoding:NSUTF8StringEncoding];

  RCTFontProperties fontProperties;
  fontProperties.family = fontFamily;
  fontProperties.size = textAttributes.fontSize;
  fontProperties.style = textAttributes.fontStyle.hasValue()
      ? RCTFontStyleFromFontStyle(textAttributes.fontStyle.value())
      : RCTFontStyleUndefined;
  fontProperties.variant = textAttributes.fontVariant.hasValue()
      ? RCTFontVariantFromFontVariant(textAttributes.fontVariant.value())
      : RCTFontVariantDefault;
  fontProperties.weight = textAttributes.fontWeight.hasValue()
      ? CGFloat(textAttributes.fontWeight.value())
      : NAN;
  fontProperties.sizeMultiplier = textAttributes.fontSizeMultiplier;

  return RCTFontWithFontProperties(fontProperties);
}

inline static CGFloat RCTEffectiveFontSizeMultiplierFromTextAttributes(
    const TextAttributes &textAttributes) {
  return textAttributes.allowFontScaling.value_or(true) &&
          !isnan(textAttributes.fontSizeMultiplier)
      ? textAttributes.fontSizeMultiplier
      : 1.0;
}

inline static UIColor *RCTEffectiveForegroundColorFromTextAttributes(
    const TextAttributes &textAttributes) {
  UIColor *effectiveForegroundColor =
      RCTUIColorFromSharedColor(textAttributes.foregroundColor)
      ?: [UIColor blackColor];

  if (!isnan(textAttributes.opacity)) {
    effectiveForegroundColor = [effectiveForegroundColor
        colorWithAlphaComponent:CGColorGetAlpha(
                                    effectiveForegroundColor.CGColor) *
        textAttributes.opacity];
  }

  return effectiveForegroundColor;
}

inline static UIColor *RCTEffectiveBackgroundColorFromTextAttributes(
    const TextAttributes &textAttributes) {
  UIColor *effectiveBackgroundColor =
      RCTUIColorFromSharedColor(textAttributes.backgroundColor);

  if (effectiveBackgroundColor && !isnan(textAttributes.opacity)) {
    effectiveBackgroundColor = [effectiveBackgroundColor
        colorWithAlphaComponent:CGColorGetAlpha(
                                    effectiveBackgroundColor.CGColor) *
        textAttributes.opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
}

static NSDictionary<NSAttributedStringKey, id> *
RCTNSTextAttributesFromTextAttributes(const TextAttributes &textAttributes) {
  NSMutableDictionary<NSAttributedStringKey, id> *attributes =
      [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = RCTEffectiveFontFromTextAttributes(textAttributes);
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor =
      RCTEffectiveForegroundColorFromTextAttributes(textAttributes);

  if (textAttributes.foregroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (textAttributes.backgroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSBackgroundColorAttributeName] =
        RCTEffectiveBackgroundColorFromTextAttributes(textAttributes);
  }

  // Kerning
  if (!isnan(textAttributes.letterSpacing)) {
    attributes[NSKernAttributeName] = @(textAttributes.letterSpacing);
  }

  // Paragraph Style
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  BOOL isParagraphStyleUsed = NO;
  if (textAttributes.alignment.hasValue()) {
    TextAlignment textAlignment =
        textAttributes.alignment.value_or(TextAlignment::Natural);
    if (textAttributes.layoutDirection.value_or(LayoutDirection::LeftToRight) ==
        LayoutDirection::RightToLeft) {
      if (textAlignment == TextAlignment::Right) {
        textAlignment = TextAlignment::Left;
      } else if (textAlignment == TextAlignment::Left) {
        textAlignment = TextAlignment::Right;
      }
    }

    paragraphStyle.alignment =
        RCTNSTextAlignmentFromTextAlignment(textAlignment);
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.baseWritingDirection.hasValue()) {
    paragraphStyle.baseWritingDirection =
        RCTNSWritingDirectionFromWritingDirection(
            textAttributes.baseWritingDirection.value());
    isParagraphStyleUsed = YES;
  }

  if (!isnan(textAttributes.lineHeight)) {
    CGFloat lineHeight = textAttributes.lineHeight *
        RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    isParagraphStyleUsed = YES;
  }

  if (isParagraphStyleUsed) {
    attributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }

  // Decoration
  if (textAttributes.textDecorationLineType.value_or(
          TextDecorationLineType::None) != TextDecorationLineType::None) {
    auto textDecorationLineType = textAttributes.textDecorationLineType.value();

    NSUnderlineStyle style = RCTNSUnderlineStyleFromStyleAndPattern(
        textAttributes.textDecorationLineStyle.value_or(
            TextDecorationLineStyle::Single),
        textAttributes.textDecorationLinePattern.value_or(
            TextDecorationLinePattern::Solid));

    UIColor *textDecorationColor =
        RCTUIColorFromSharedColor(textAttributes.textDecorationColor);

    // Underline
    if (textDecorationLineType == TextDecorationLineType::Underline ||
        textDecorationLineType ==
            TextDecorationLineType::UnderlineStrikethrough) {
      attributes[NSUnderlineStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSUnderlineColorAttributeName] = textDecorationColor;
      }
    }

    // Strikethrough
    if (textDecorationLineType == TextDecorationLineType::Strikethrough ||
        textDecorationLineType ==
            TextDecorationLineType::UnderlineStrikethrough) {
      attributes[NSStrikethroughStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSStrikethroughColorAttributeName] = textDecorationColor;
      }
    }
  }

  // Shadow
  if (textAttributes.textShadowOffset.hasValue()) {
    auto textShadowOffset = textAttributes.textShadowOffset.value();
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset =
        CGSize{textShadowOffset.width, textShadowOffset.height};
    shadow.shadowBlurRadius = textAttributes.textShadowRadius;
    shadow.shadowColor =
        RCTUIColorFromSharedColor(textAttributes.textShadowColor);
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (textAttributes.isHighlighted) {
    attributes[RCTAttributedStringIsHighlightedAttributeName] = @YES;
  }

  return [attributes copy];
}

NSAttributedString *RCTNSAttributedStringFromAttributedString(
    const AttributedString &attributedString) {
  NSMutableAttributedString *nsAttributedString =
      [[NSMutableAttributedString alloc] init];

  [nsAttributedString beginEditing];

  for (auto fragment : attributedString.getFragments()) {
    NSAttributedString *nsAttributedStringFragment;

    auto layoutMetrics = fragment.shadowView.layoutMetrics;

    if (layoutMetrics != EmptyLayoutMetrics) {
      CGRect bounds = {.origin = {.x = layoutMetrics.frame.origin.x,
                                  .y = layoutMetrics.frame.origin.y},
                       .size = {.width = layoutMetrics.frame.size.width,
                                .height = layoutMetrics.frame.size.height}};

      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.bounds = bounds;

      nsAttributedStringFragment =
          [NSAttributedString attributedStringWithAttachment:attachment];
    } else {
      NSString *string = [NSString stringWithCString:fragment.string.c_str()
                                            encoding:NSUTF8StringEncoding];

      nsAttributedStringFragment = [[NSAttributedString alloc]
          initWithString:string
              attributes:RCTNSTextAttributesFromTextAttributes(
                             fragment.textAttributes)];
    }

    NSMutableAttributedString *nsMutableAttributedStringFragment =
        [[NSMutableAttributedString alloc]
            initWithAttributedString:nsAttributedStringFragment];

    if (fragment.parentShadowView.componentHandle) {
      RCTWeakEventEmitterWrapper *eventEmitterWrapper =
          [RCTWeakEventEmitterWrapper new];
      eventEmitterWrapper.eventEmitter = fragment.parentShadowView.eventEmitter;

      NSDictionary<NSAttributedStringKey, id> *additionalTextAttributes =
          @{RCTAttributedStringEventEmitterKey : eventEmitterWrapper};

      [nsMutableAttributedStringFragment
          addAttributes:additionalTextAttributes
                  range:NSMakeRange(
                            0, nsMutableAttributedStringFragment.length)];
    }

    [nsAttributedString
        appendAttributedString:nsMutableAttributedStringFragment];
  }

  [nsAttributedString endEditing];

  return nsAttributedString;
}
