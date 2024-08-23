/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextAttributes.h>

#import <React/RCTAssert.h>
#import <React/RCTFont.h>
#import <React/RCTLog.h>

NSString *const RCTTextAttributesIsHighlightedAttributeName = @"RCTTextAttributesIsHighlightedAttributeName";
NSString *const RCTTextAttributesTagAttributeName = @"RCTTextAttributesTagAttributeName";

@implementation RCTTextAttributes

- (instancetype)init
{
  if (self = [super init]) {
    _fontSize = NAN;
    _letterSpacing = NAN;
    _lineHeight = NAN;
    _textDecorationStyle = NSUnderlineStyleSingle;
    _fontSizeMultiplier = NAN;
    _maxFontSizeMultiplier = NAN;
    _alignment = NSTextAlignmentNatural;
    _baseWritingDirection = NSWritingDirectionNatural;
    _lineBreakStrategy = NSLineBreakStrategyNone;
    _lineBreakMode = NSLineBreakByWordWrapping;
    _textShadowRadius = NAN;
    _opacity = NAN;
    _textTransform = RCTTextTransformUndefined;
  }

  return self;
}

- (void)applyTextAttributes:(RCTTextAttributes *)textAttributes
{
  // Note: All lines marked with `*` does not use explicit/correct rules to compare old and new values because
  // their types do not have special designated value representing undefined/unspecified/inherit meaning.
  // We will address this in the future.

  // Color
  _foregroundColor = textAttributes->_foregroundColor ?: _foregroundColor;
  _backgroundColor = textAttributes->_backgroundColor ?: _backgroundColor;
  _opacity =
      !isnan(textAttributes->_opacity) ? (isnan(_opacity) ? 1.0 : _opacity) * textAttributes->_opacity : _opacity;

  // Font
  _fontFamily = textAttributes->_fontFamily ?: _fontFamily;
  _fontSize = !isnan(textAttributes->_fontSize) ? textAttributes->_fontSize : _fontSize;
  _fontSizeMultiplier =
      !isnan(textAttributes->_fontSizeMultiplier) ? textAttributes->_fontSizeMultiplier : _fontSizeMultiplier;
  _maxFontSizeMultiplier =
      !isnan(textAttributes->_maxFontSizeMultiplier) ? textAttributes->_maxFontSizeMultiplier : _maxFontSizeMultiplier;
  _fontWeight = textAttributes->_fontWeight ?: _fontWeight;
  _fontStyle = textAttributes->_fontStyle ?: _fontStyle;
  _fontVariant = textAttributes->_fontVariant ?: _fontVariant;
  _allowFontScaling = textAttributes->_allowFontScaling || _allowFontScaling; // *
  _dynamicTypeRamp = textAttributes->_dynamicTypeRamp != RCTDynamicTypeRampUndefined ? textAttributes->_dynamicTypeRamp
                                                                                     : _dynamicTypeRamp;
  _letterSpacing = !isnan(textAttributes->_letterSpacing) ? textAttributes->_letterSpacing : _letterSpacing;

  // Paragraph Styles
  _lineHeight = !isnan(textAttributes->_lineHeight) ? textAttributes->_lineHeight : _lineHeight;
  _alignment = textAttributes->_alignment != NSTextAlignmentNatural ? textAttributes->_alignment : _alignment; // *
  _baseWritingDirection = textAttributes->_baseWritingDirection != NSWritingDirectionNatural
      ? textAttributes->_baseWritingDirection
      : _baseWritingDirection; // *
  _lineBreakStrategy = textAttributes->_lineBreakStrategy ?: _lineBreakStrategy;
  _lineBreakMode = textAttributes->_lineBreakMode ?: _lineBreakMode;

  // Decoration
  _textDecorationColor = textAttributes->_textDecorationColor ?: _textDecorationColor;
  _textDecorationStyle = textAttributes->_textDecorationStyle != NSUnderlineStyleSingle
      ? textAttributes->_textDecorationStyle
      : _textDecorationStyle; // *
  _textDecorationLine = textAttributes->_textDecorationLine != RCTTextDecorationLineTypeNone
      ? textAttributes->_textDecorationLine
      : _textDecorationLine; // *

  // Shadow
  _textShadowOffset = !CGSizeEqualToSize(textAttributes->_textShadowOffset, CGSizeZero)
      ? textAttributes->_textShadowOffset
      : _textShadowOffset; // *
  _textShadowRadius = !isnan(textAttributes->_textShadowRadius) ? textAttributes->_textShadowRadius : _textShadowRadius;
  _textShadowColor = textAttributes->_textShadowColor ?: _textShadowColor;

  // Special
  _isHighlighted = textAttributes->_isHighlighted || _isHighlighted; // *
  _tag = textAttributes->_tag ?: _tag;
  _layoutDirection = textAttributes->_layoutDirection != UIUserInterfaceLayoutDirectionLeftToRight
      ? textAttributes->_layoutDirection
      : _layoutDirection;
  _textTransform =
      textAttributes->_textTransform != RCTTextTransformUndefined ? textAttributes->_textTransform : _textTransform;
}

- (NSParagraphStyle *)effectiveParagraphStyle
{
  // Paragraph Style
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  BOOL isParagraphStyleUsed = NO;
  if (_alignment != NSTextAlignmentNatural) {
    NSTextAlignment alignment = _alignment;
    if (_layoutDirection == UIUserInterfaceLayoutDirectionRightToLeft) {
      if (alignment == NSTextAlignmentRight) {
        alignment = NSTextAlignmentLeft;
      } else if (alignment == NSTextAlignmentLeft) {
        alignment = NSTextAlignmentRight;
      }
    }

    paragraphStyle.alignment = alignment;
    isParagraphStyleUsed = YES;
  }

  if (_baseWritingDirection != NSWritingDirectionNatural) {
    paragraphStyle.baseWritingDirection = _baseWritingDirection;
    isParagraphStyleUsed = YES;
  }

  if (_lineBreakStrategy != NSLineBreakStrategyNone) {
    if (@available(iOS 14.0, *)) {
      paragraphStyle.lineBreakStrategy = _lineBreakStrategy;
      isParagraphStyleUsed = YES;
    }
  }

  if (_lineBreakMode != NSLineBreakByWordWrapping) {
    paragraphStyle.lineBreakMode = _lineBreakMode;
    isParagraphStyleUsed = YES;
  }

  if (!isnan(_lineHeight)) {
    CGFloat lineHeight = _lineHeight * self.effectiveFontSizeMultiplier;
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    isParagraphStyleUsed = YES;
  }

  if (isParagraphStyleUsed) {
    return [paragraphStyle copy];
  }

  return nil;
}

- (NSDictionary<NSAttributedStringKey, id> *)effectiveTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = self.effectiveFont;
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor = self.effectiveForegroundColor;

  if (_foregroundColor || !isnan(_opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (_backgroundColor || !isnan(_opacity)) {
    attributes[NSBackgroundColorAttributeName] = self.effectiveBackgroundColor;
  }

  // Kerning
  if (!isnan(_letterSpacing)) {
    attributes[NSKernAttributeName] = @(_letterSpacing);
  }

  // Paragraph Style
  NSParagraphStyle *paragraphStyle = [self effectiveParagraphStyle];
  if (paragraphStyle) {
    attributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }

  // Decoration
  BOOL isTextDecorationEnabled = NO;
  if (_textDecorationLine == RCTTextDecorationLineTypeUnderline ||
      _textDecorationLine == RCTTextDecorationLineTypeUnderlineStrikethrough) {
    isTextDecorationEnabled = YES;
    attributes[NSUnderlineStyleAttributeName] = @(_textDecorationStyle);
  }

  if (_textDecorationLine == RCTTextDecorationLineTypeStrikethrough ||
      _textDecorationLine == RCTTextDecorationLineTypeUnderlineStrikethrough) {
    isTextDecorationEnabled = YES;
    attributes[NSStrikethroughStyleAttributeName] = @(_textDecorationStyle);
  }

  if (_textDecorationColor || isTextDecorationEnabled) {
    attributes[NSStrikethroughColorAttributeName] = _textDecorationColor ?: effectiveForegroundColor;
    attributes[NSUnderlineColorAttributeName] = _textDecorationColor ?: effectiveForegroundColor;
  }

  // Shadow
  if (!isnan(_textShadowRadius)) {
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = _textShadowOffset;
    shadow.shadowBlurRadius = _textShadowRadius;
    shadow.shadowColor = _textShadowColor;
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (_isHighlighted) {
    attributes[RCTTextAttributesIsHighlightedAttributeName] = @YES;
  }

  if (_tag) {
    attributes[RCTTextAttributesTagAttributeName] = _tag;
  }

  return [attributes copy];
}

- (UIFont *)effectiveFont
{
  // FIXME: RCTFont has thread-safety issues and must be rewritten.
  return [RCTFont updateFont:nil
                  withFamily:_fontFamily
                        size:@(isnan(_fontSize) ? 0 : _fontSize)
                      weight:_fontWeight
                       style:_fontStyle
                     variant:_fontVariant
             scaleMultiplier:self.effectiveFontSizeMultiplier];
}

- (CGFloat)effectiveFontSizeMultiplier
{
  bool fontScalingEnabled = !RCTHasFontHandlerSet() && _allowFontScaling;

  if (fontScalingEnabled) {
    CGFloat fontSizeMultiplier = !isnan(_fontSizeMultiplier) ? _fontSizeMultiplier : 1.0;
    if (_dynamicTypeRamp != RCTDynamicTypeRampUndefined) {
      UIFontMetrics *fontMetrics = RCTUIFontMetricsForDynamicTypeRamp(_dynamicTypeRamp);
      // Using a specific font size reduces rounding errors from -scaledValueForValue:
      CGFloat requestedSize = isnan(_fontSize) ? RCTBaseSizeForDynamicTypeRamp(_dynamicTypeRamp) : _fontSize;
      fontSizeMultiplier = [fontMetrics scaledValueForValue:requestedSize] / requestedSize;
    }
    CGFloat maxFontSizeMultiplier = !isnan(_maxFontSizeMultiplier) ? _maxFontSizeMultiplier : 0.0;
    return maxFontSizeMultiplier >= 1.0 ? fminf(maxFontSizeMultiplier, fontSizeMultiplier) : fontSizeMultiplier;
  } else {
    return 1.0;
  }
}

- (UIColor *)effectiveForegroundColor
{
  UIColor *effectiveForegroundColor = _foregroundColor ?: [UIColor blackColor];

  if (!isnan(_opacity)) {
    effectiveForegroundColor =
        [effectiveForegroundColor colorWithAlphaComponent:CGColorGetAlpha(effectiveForegroundColor.CGColor) * _opacity];
  }

  return effectiveForegroundColor;
}

- (UIColor *)effectiveBackgroundColor
{
  UIColor *effectiveBackgroundColor = _backgroundColor; // ?: [[UIColor whiteColor] colorWithAlphaComponent:0];

  if (effectiveBackgroundColor && !isnan(_opacity)) {
    effectiveBackgroundColor =
        [effectiveBackgroundColor colorWithAlphaComponent:CGColorGetAlpha(effectiveBackgroundColor.CGColor) * _opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
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

- (NSString *)applyTextAttributesToText:(NSString *)text
{
  switch (_textTransform) {
    case RCTTextTransformUndefined:
    case RCTTextTransformNone:
      return text;
    case RCTTextTransformLowercase:
      return [text lowercaseString];
    case RCTTextTransformUppercase:
      return [text uppercaseString];
    case RCTTextTransformCapitalize:
      return capitalizeText(text);
  }
}

- (RCTTextAttributes *)copyWithZone:(NSZone *)zone
{
  RCTTextAttributes *textAttributes = [RCTTextAttributes new];
  [textAttributes applyTextAttributes:self];
  return textAttributes;
}

#pragma mark - NSObject

- (BOOL)isEqual:(RCTTextAttributes *)textAttributes
{
  if (!textAttributes) {
    return NO;
  }
  if (self == textAttributes) {
    return YES;
  }

#define RCTTextAttributesCompareFloats(a) ((a == textAttributes->a) || (isnan(a) && isnan(textAttributes->a)))
#define RCTTextAttributesCompareSize(a) CGSizeEqualToSize(a, textAttributes->a)
#define RCTTextAttributesCompareObjects(a) ((a == textAttributes->a) || [a isEqual:textAttributes->a])
#define RCTTextAttributesCompareStrings(a) ((a == textAttributes->a) || [a isEqualToString:textAttributes->a])
#define RCTTextAttributesCompareOthers(a) (a == textAttributes->a)

  return RCTTextAttributesCompareObjects(_foregroundColor) && RCTTextAttributesCompareObjects(_backgroundColor) &&
      RCTTextAttributesCompareFloats(_opacity) &&
      // Font
      RCTTextAttributesCompareObjects(_fontFamily) && RCTTextAttributesCompareFloats(_fontSize) &&
      RCTTextAttributesCompareFloats(_fontSizeMultiplier) && RCTTextAttributesCompareFloats(_maxFontSizeMultiplier) &&
      RCTTextAttributesCompareStrings(_fontWeight) && RCTTextAttributesCompareObjects(_fontStyle) &&
      RCTTextAttributesCompareObjects(_fontVariant) && RCTTextAttributesCompareOthers(_allowFontScaling) &&
      RCTTextAttributesCompareOthers(_dynamicTypeRamp) && RCTTextAttributesCompareFloats(_letterSpacing) &&
      // Paragraph Styles
      RCTTextAttributesCompareFloats(_lineHeight) && RCTTextAttributesCompareFloats(_alignment) &&
      RCTTextAttributesCompareOthers(_baseWritingDirection) && RCTTextAttributesCompareOthers(_lineBreakStrategy) &&
      RCTTextAttributesCompareOthers(_lineBreakMode) &&
      // Decoration
      RCTTextAttributesCompareObjects(_textDecorationColor) && RCTTextAttributesCompareOthers(_textDecorationStyle) &&
      RCTTextAttributesCompareOthers(_textDecorationLine) &&
      // Shadow
      RCTTextAttributesCompareSize(_textShadowOffset) && RCTTextAttributesCompareFloats(_textShadowRadius) &&
      RCTTextAttributesCompareObjects(_textShadowColor) &&
      // Special
      RCTTextAttributesCompareOthers(_isHighlighted) && RCTTextAttributesCompareObjects(_tag) &&
      RCTTextAttributesCompareOthers(_layoutDirection) && RCTTextAttributesCompareOthers(_textTransform);
}

@end
