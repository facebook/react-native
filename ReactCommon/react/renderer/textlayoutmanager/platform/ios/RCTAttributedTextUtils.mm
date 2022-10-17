/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAttributedTextUtils.h"

#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/textlayoutmanager/RCTFontProperties.h>
#include <react/renderer/textlayoutmanager/RCTFontUtils.h>
#include <react/renderer/textlayoutmanager/RCTTextPrimitivesConversions.h>
#include <react/utils/ManagedObjectWrapper.h>

using namespace facebook::react;

@implementation RCTWeakEventEmitterWrapper {
  std::weak_ptr<const EventEmitter> _weakEventEmitter;
}

- (void)setEventEmitter:(SharedEventEmitter)eventEmitter
{
  _weakEventEmitter = eventEmitter;
}

- (SharedEventEmitter)eventEmitter
{
  return _weakEventEmitter.lock();
}

- (void)dealloc
{
  _weakEventEmitter.reset();
}

@end

inline static UIFontWeight RCTUIFontWeightFromInteger(NSInteger fontWeight)
{
  assert(fontWeight > 50);
  assert(fontWeight < 950);

  static UIFontWeight weights[] = {
      /* ~100 */ UIFontWeightUltraLight,
      /* ~200 */ UIFontWeightThin,
      /* ~300 */ UIFontWeightLight,
      /* ~400 */ UIFontWeightRegular,
      /* ~500 */ UIFontWeightMedium,
      /* ~600 */ UIFontWeightSemibold,
      /* ~700 */ UIFontWeightBold,
      /* ~800 */ UIFontWeightHeavy,
      /* ~900 */ UIFontWeightBlack};
  // The expression is designed to convert something like 760 or 830 to 7.
  return weights[(fontWeight + 50) / 100 - 1];
}

inline static UIFont *RCTEffectiveFontFromTextAttributes(const TextAttributes &textAttributes)
{
  NSString *fontFamily = [NSString stringWithCString:textAttributes.fontFamily.c_str() encoding:NSUTF8StringEncoding];

  RCTFontProperties fontProperties;
  fontProperties.family = fontFamily;
  fontProperties.size = textAttributes.fontSize;
  fontProperties.style = textAttributes.fontStyle.has_value()
      ? RCTFontStyleFromFontStyle(textAttributes.fontStyle.value())
      : RCTFontStyleUndefined;
  fontProperties.variant = textAttributes.fontVariant.has_value()
      ? RCTFontVariantFromFontVariant(textAttributes.fontVariant.value())
      : RCTFontVariantUndefined;
  fontProperties.weight = textAttributes.fontWeight.has_value()
      ? RCTUIFontWeightFromInteger((NSInteger)textAttributes.fontWeight.value())
      : NAN;
  fontProperties.sizeMultiplier = textAttributes.fontSizeMultiplier;

  return RCTFontWithFontProperties(fontProperties);
}

inline static CGFloat RCTEffectiveFontSizeMultiplierFromTextAttributes(const TextAttributes &textAttributes)
{
  return textAttributes.allowFontScaling.value_or(true) && !isnan(textAttributes.fontSizeMultiplier)
      ? textAttributes.fontSizeMultiplier
      : 1.0;
}

inline static UIColor *RCTEffectiveForegroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveForegroundColor = RCTUIColorFromSharedColor(textAttributes.foregroundColor) ?: [UIColor blackColor];

  if (!isnan(textAttributes.opacity)) {
    effectiveForegroundColor = [effectiveForegroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveForegroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveForegroundColor;
}

inline static UIColor *RCTEffectiveBackgroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveBackgroundColor = RCTUIColorFromSharedColor(textAttributes.backgroundColor);

  if (effectiveBackgroundColor && !isnan(textAttributes.opacity)) {
    effectiveBackgroundColor = [effectiveBackgroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveBackgroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
}

NSDictionary<NSAttributedStringKey, id> *RCTNSTextAttributesFromTextAttributes(TextAttributes const &textAttributes)
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = RCTEffectiveFontFromTextAttributes(textAttributes);
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor = RCTEffectiveForegroundColorFromTextAttributes(textAttributes);

  if (textAttributes.foregroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (textAttributes.backgroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSBackgroundColorAttributeName] = RCTEffectiveBackgroundColorFromTextAttributes(textAttributes);
  }

  // Kerning
  if (!isnan(textAttributes.letterSpacing)) {
    attributes[NSKernAttributeName] = @(textAttributes.letterSpacing);
  }

  // Paragraph Style
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  BOOL isParagraphStyleUsed = NO;
  if (textAttributes.alignment.has_value()) {
    TextAlignment textAlignment = textAttributes.alignment.value_or(TextAlignment::Natural);
    if (textAttributes.layoutDirection.value_or(LayoutDirection::LeftToRight) == LayoutDirection::RightToLeft) {
      if (textAlignment == TextAlignment::Right) {
        textAlignment = TextAlignment::Left;
      } else if (textAlignment == TextAlignment::Left) {
        textAlignment = TextAlignment::Right;
      }
    }

    paragraphStyle.alignment = RCTNSTextAlignmentFromTextAlignment(textAlignment);
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.baseWritingDirection.has_value()) {
    paragraphStyle.baseWritingDirection =
        RCTNSWritingDirectionFromWritingDirection(textAttributes.baseWritingDirection.value());
    isParagraphStyleUsed = YES;
  }

  if (!isnan(textAttributes.lineHeight)) {
    CGFloat lineHeight = textAttributes.lineHeight * RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    isParagraphStyleUsed = YES;
  }

  if (isParagraphStyleUsed) {
    attributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }

  // Decoration
  if (textAttributes.textDecorationLineType.value_or(TextDecorationLineType::None) != TextDecorationLineType::None) {
    auto textDecorationLineType = textAttributes.textDecorationLineType.value();

    NSUnderlineStyle style = RCTNSUnderlineStyleFromTextDecorationStyle(
        textAttributes.textDecorationStyle.value_or(TextDecorationStyle::Solid));

    UIColor *textDecorationColor = RCTUIColorFromSharedColor(textAttributes.textDecorationColor);

    // Underline
    if (textDecorationLineType == TextDecorationLineType::Underline ||
        textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
      attributes[NSUnderlineStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSUnderlineColorAttributeName] = textDecorationColor;
      }
    }

    // Strikethrough
    if (textDecorationLineType == TextDecorationLineType::Strikethrough ||
        textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
      attributes[NSStrikethroughStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSStrikethroughColorAttributeName] = textDecorationColor;
      }
    }
  }

  // Shadow
  if (textAttributes.textShadowOffset.has_value()) {
    auto textShadowOffset = textAttributes.textShadowOffset.value();
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = CGSize{textShadowOffset.width, textShadowOffset.height};
    shadow.shadowBlurRadius = textAttributes.textShadowRadius;
    shadow.shadowColor = RCTUIColorFromSharedColor(textAttributes.textShadowColor);
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (textAttributes.isHighlighted) {
    attributes[RCTAttributedStringIsHighlightedAttributeName] = @YES;
  }

  if (textAttributes.accessibilityRole.has_value()) {
    auto accessibilityRole = textAttributes.accessibilityRole.value();
    switch (accessibilityRole) {
      case AccessibilityRole::None:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("none");
        break;
      case AccessibilityRole::Button:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("button");
        break;
      case AccessibilityRole::Link:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("link");
        break;
      case AccessibilityRole::Search:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("search");
        break;
      case AccessibilityRole::Image:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("image");
        break;
      case AccessibilityRole::Imagebutton:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("imagebutton");
        break;
      case AccessibilityRole::Keyboardkey:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("keyboardkey");
        break;
      case AccessibilityRole::Text:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("text");
        break;
      case AccessibilityRole::Adjustable:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("adjustable");
        break;
      case AccessibilityRole::Summary:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("summary");
        break;
      case AccessibilityRole::Header:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("header");
        break;
      case AccessibilityRole::Alert:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("alert");
        break;
      case AccessibilityRole::Checkbox:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("checkbox");
        break;
      case AccessibilityRole::Combobox:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("combobox");
        break;
      case AccessibilityRole::Menu:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("menu");
        break;
      case AccessibilityRole::Menubar:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("menubar");
        break;
      case AccessibilityRole::Menuitem:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("menuitem");
        break;
      case AccessibilityRole::Progressbar:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("progressbar");
        break;
      case AccessibilityRole::Radio:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("radio");
        break;
      case AccessibilityRole::Radiogroup:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("radiogroup");
        break;
      case AccessibilityRole::Scrollbar:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("scrollbar");
        break;
      case AccessibilityRole::Spinbutton:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("spinbutton");
        break;
      case AccessibilityRole::Switch:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("switch");
        break;
      case AccessibilityRole::Tab:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("tab");
        break;
      case AccessibilityRole::TabBar:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("tabbar");
        break;
      case AccessibilityRole::Tablist:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("tablist");
        break;
      case AccessibilityRole::Timer:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("timer");
        break;
      case AccessibilityRole::Toolbar:
        attributes[RCTTextAttributesAccessibilityRoleAttributeName] = @("toolbar");
        break;
    };
  }

  return [attributes copy];
}

static void RCTApplyBaselineOffset(NSMutableAttributedString *attributedText)
{
  __block CGFloat maximumLineHeight = 0;

  [attributedText enumerateAttribute:NSParagraphStyleAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(NSParagraphStyle *paragraphStyle, __unused NSRange range, __unused BOOL *stop) {
                            if (!paragraphStyle) {
                              return;
                            }

                            maximumLineHeight = MAX(paragraphStyle.maximumLineHeight, maximumLineHeight);
                          }];

  if (maximumLineHeight == 0) {
    // `lineHeight` was not specified, nothing to do.
    return;
  }

  __block CGFloat maximumFontLineHeight = 0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(UIFont *font, NSRange range, __unused BOOL *stop) {
                            if (!font) {
                              return;
                            }

                            maximumFontLineHeight = MAX(font.lineHeight, maximumFontLineHeight);
                          }];

  if (maximumLineHeight < maximumFontLineHeight) {
    return;
  }

  CGFloat baseLineOffset = (maximumLineHeight - maximumFontLineHeight) / 2.0;

  [attributedText addAttribute:NSBaselineOffsetAttributeName
                         value:@(baseLineOffset)
                         range:NSMakeRange(0, attributedText.length)];
}

NSAttributedString *RCTNSAttributedStringFromAttributedString(const AttributedString &attributedString)
{
  static UIImage *placeholderImage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    placeholderImage = [UIImage new];
  });

  NSMutableAttributedString *nsAttributedString = [NSMutableAttributedString new];

  [nsAttributedString beginEditing];

  for (auto fragment : attributedString.getFragments()) {
    NSMutableAttributedString *nsAttributedStringFragment;

    if (fragment.isAttachment()) {
      auto layoutMetrics = fragment.parentShadowView.layoutMetrics;
      CGRect bounds = {
          .origin = {.x = layoutMetrics.frame.origin.x, .y = layoutMetrics.frame.origin.y},
          .size = {.width = layoutMetrics.frame.size.width, .height = layoutMetrics.frame.size.height}};

      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.image = placeholderImage;
      attachment.bounds = bounds;

      nsAttributedStringFragment = [[NSMutableAttributedString attributedStringWithAttachment:attachment] mutableCopy];
    } else {
      NSString *string = [NSString stringWithCString:fragment.string.c_str() encoding:NSUTF8StringEncoding];

      if (fragment.textAttributes.textTransform.has_value()) {
        auto textTransform = fragment.textAttributes.textTransform.value();
        string = RCTNSStringFromStringApplyingTextTransform(string, textTransform);
      }

      nsAttributedStringFragment = [[NSMutableAttributedString alloc]
          initWithString:string
              attributes:RCTNSTextAttributesFromTextAttributes(fragment.textAttributes)];
    }

    if (fragment.parentShadowView.componentHandle) {
      RCTWeakEventEmitterWrapper *eventEmitterWrapper = [RCTWeakEventEmitterWrapper new];
      eventEmitterWrapper.eventEmitter = fragment.parentShadowView.eventEmitter;

      NSDictionary<NSAttributedStringKey, id> *additionalTextAttributes =
          @{RCTAttributedStringEventEmitterKey : eventEmitterWrapper};

      [nsAttributedStringFragment addAttributes:additionalTextAttributes
                                          range:NSMakeRange(0, nsAttributedStringFragment.length)];
    }

    [nsAttributedString appendAttributedString:nsAttributedStringFragment];
  }
  RCTApplyBaselineOffset(nsAttributedString);
  [nsAttributedString endEditing];

  return nsAttributedString;
}

NSAttributedString *RCTNSAttributedStringFromAttributedStringBox(AttributedStringBox const &attributedStringBox)
{
  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value:
      return RCTNSAttributedStringFromAttributedString(attributedStringBox.getValue());
    case AttributedStringBox::Mode::OpaquePointer:
      return (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());
  }
}

AttributedStringBox RCTAttributedStringBoxFromNSAttributedString(NSAttributedString *nsAttributedString)
{
  return nsAttributedString.length ? AttributedStringBox{wrapManagedObject(nsAttributedString)} : AttributedStringBox{};
}

static NSString *capitalizeText(NSString *text)
{
  NSArray *words = [text componentsSeparatedByString:@" "];
  NSMutableArray *newWords = [NSMutableArray new];
  NSNumberFormatter *num = [NSNumberFormatter new];
  for (NSString *item in words) {
    NSString *word;
    if ([item length] > 0 && [num numberFromString:[item substringWithRange:NSMakeRange(0, 1)]] == nil) {
      word = [item capitalizedString];
    } else {
      word = [item lowercaseString];
    }
    [newWords addObject:word];
  }
  return [newWords componentsJoinedByString:@" "];
}

NSString *RCTNSStringFromStringApplyingTextTransform(NSString *string, TextTransform textTransform)
{
  switch (textTransform) {
    case TextTransform::Uppercase:
      return [string uppercaseString];
    case TextTransform::Lowercase:
      return [string lowercaseString];
    case TextTransform::Capitalize:
      return capitalizeText(string);
    default:
      return string;
  }
}
