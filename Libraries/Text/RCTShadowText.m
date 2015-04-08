/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowText.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowRawText.h"
#import "RCTUtils.h"

NSString *const RCTIsHighlightedAttributeName = @"IsHighlightedAttributeName";
NSString *const RCTReactTagAttributeName = @"ReactTagAttributeName";

static css_dim_t RCTMeasure(void *context, float width)
{
  RCTShadowText *shadowText = (__bridge RCTShadowText *)context;

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:[shadowText attributedString]];
  [textStorage addLayoutManager:shadowText.layoutManager];

  shadowText.textContainer.size = CGSizeMake(isnan(width) ? CGFLOAT_MAX : width, CGFLOAT_MAX);
  shadowText.layoutManager.textStorage = textStorage;
  [shadowText.layoutManager ensureLayoutForTextContainer:shadowText.textContainer];

  CGSize computedSize = [shadowText.layoutManager usedRectForTextContainer:shadowText.textContainer].size;

  [textStorage removeLayoutManager:shadowText.layoutManager];

  css_dim_t result;
  result.dimensions[CSS_WIDTH] = RCTCeilPixelValue(computedSize.width);
  result.dimensions[CSS_HEIGHT] = RCTCeilPixelValue(computedSize.height);
  return result;
}

@implementation RCTShadowText {
  NSLayoutManager *_layoutManager;
  NSTextContainer *_textContainer;
  NSAttributedString *_cachedAttributedString;
  UIFont *_font;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _fontSize = NAN;
    _isHighlighted = NO;

    _textContainer = [[NSTextContainer alloc] init];
    _textContainer.lineBreakMode = NSLineBreakByTruncatingTail;
    _textContainer.lineFragmentPadding = 0.0;

    _layoutManager = [[NSLayoutManager alloc] init];
    [_layoutManager addTextContainer:_textContainer];
  }

  return self;
}

- (NSAttributedString *)attributedString
{
  return [self _attributedStringWithFontFamily:nil
                                      fontSize:0
                                    fontWeight:nil
                                     fontStyle:nil];
}

- (NSAttributedString *)_attributedStringWithFontFamily:(NSString *)fontFamily
                                               fontSize:(CGFloat)fontSize
                                             fontWeight:(NSString *)fontWeight
                                              fontStyle:(NSString *)fontStyle
{
  if (![self isTextDirty] && _cachedAttributedString) {
    return _cachedAttributedString;
  }

  if (_fontSize && !isnan(_fontSize)) {
    fontSize = _fontSize;
  }
  if (_fontWeight) {
    fontWeight = _fontWeight;
  }
  if (_fontStyle) {
    fontStyle = _fontStyle;
  }
  if (_fontFamily) {
    fontFamily = _fontFamily;
  }

  NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc] init];
  for (RCTShadowView *child in [self reactSubviews]) {
    if ([child isKindOfClass:[RCTShadowText class]]) {
      RCTShadowText *shadowText = (RCTShadowText *)child;
      [attributedString appendAttributedString:[shadowText _attributedStringWithFontFamily:fontFamily fontSize:fontSize fontWeight:fontWeight fontStyle:fontStyle]];
    } else if ([child isKindOfClass:[RCTShadowRawText class]]) {
      RCTShadowRawText *shadowRawText = (RCTShadowRawText *)child;
      [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:[shadowRawText text] ?: @""]];
    } else {
      RCTLogError(@"<Text> can't have any children except <Text> or raw strings");
    }

    [child setTextComputed];
  }

  if (_color) {
    [self _addAttribute:NSForegroundColorAttributeName withValue:self.color toAttributedString:attributedString];
  }
  if (_isHighlighted) {
    [self _addAttribute:RCTIsHighlightedAttributeName withValue:@YES toAttributedString:attributedString];
  }
  if (_textBackgroundColor) {
    [self _addAttribute:NSBackgroundColorAttributeName withValue:self.textBackgroundColor toAttributedString:attributedString];
  }

  _font = [RCTConvert UIFont:nil withFamily:fontFamily size:@(fontSize) weight:fontWeight style:fontStyle];
  [self _addAttribute:NSFontAttributeName withValue:_font toAttributedString:attributedString];
  [self _addAttribute:RCTReactTagAttributeName withValue:self.reactTag toAttributedString:attributedString];
  [self _setParagraphStyleOnAttributedString:attributedString];

  // create a non-mutable attributedString for use by the Text system which avoids copies down the line
  _cachedAttributedString = [[NSAttributedString alloc] initWithAttributedString:attributedString];
  [self dirtyLayout];

  return _cachedAttributedString;
}

- (UIFont *)font
{
  return _font ?: [RCTConvert UIFont:nil withFamily:_fontFamily size:@(_fontSize) weight:_fontWeight style:_fontStyle];
}

- (void)_addAttribute:(NSString *)attribute withValue:(id)attributeValue toAttributedString:(NSMutableAttributedString *)attributedString
{
  [attributedString enumerateAttribute:attribute inRange:NSMakeRange(0, [attributedString length]) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (!value) {
      [attributedString addAttribute:attribute value:attributeValue range:range];
    }
  }];
}

/*
 * LineHeight works the same way line-height works in the web: if children and self have
 * varying lineHeights, we simply take the max.
 */
- (void)_setParagraphStyleOnAttributedString:(NSMutableAttributedString *)attributedString
{
  // check if we have lineHeight set on self
  __block BOOL hasParagraphStyle = NO;
  if (_lineHeight || _textAlign) {
    hasParagraphStyle = YES;
  }

  if (!_lineHeight) {
    self.lineHeight = 0.0;
  }

  // check for lineHeight on each of our children, update the max as we go (in self.lineHeight)
  [attributedString enumerateAttribute:NSParagraphStyleAttributeName inRange:NSMakeRange(0, [attributedString length]) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (value) {
      NSParagraphStyle *paragraphStyle = (NSParagraphStyle *)value;
      if ([paragraphStyle maximumLineHeight] > _lineHeight) {
        self.lineHeight = [paragraphStyle maximumLineHeight];
      }
      hasParagraphStyle = YES;
    }
  }];

  self.textAlign = _textAlign ?: NSTextAlignmentNatural;
  self.writingDirection = _writingDirection ?: NSWritingDirectionNatural;

  // if we found anything, set it :D
  if (hasParagraphStyle) {
    NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
    paragraphStyle.alignment = _textAlign;
    paragraphStyle.baseWritingDirection = _writingDirection;
    paragraphStyle.minimumLineHeight = _lineHeight;
    paragraphStyle.maximumLineHeight = _lineHeight;
    [attributedString addAttribute:NSParagraphStyleAttributeName
                             value:paragraphStyle
                             range:(NSRange){0, attributedString.length}];
  }
}

- (void)fillCSSNode:(css_node_t *)node
{
  [super fillCSSNode:node];
  node->measure = RCTMeasure;
  node->children_count = 0;
}

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  [self cssNode]->children_count = 0;
}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  [super removeReactSubview:subview];
  [self cssNode]->children_count = 0;
}

#define RCT_TEXT_PROPERTY(setProp, ivar, type) \
- (void)set##setProp:(type)value;              \
{                                              \
  ivar = value;                                \
  [self dirtyText];                            \
}

RCT_TEXT_PROPERTY(TextBackgroundColor, _textBackgroundColor, UIColor *);
RCT_TEXT_PROPERTY(Color, _color, UIColor *);
RCT_TEXT_PROPERTY(FontFamily, _fontFamily, NSString *);
RCT_TEXT_PROPERTY(FontSize, _fontSize, CGFloat);
RCT_TEXT_PROPERTY(FontWeight, _fontWeight, NSString *);
RCT_TEXT_PROPERTY(LineHeight, _lineHeight, CGFloat);
RCT_TEXT_PROPERTY(ShadowOffset, _shadowOffset, CGSize);
RCT_TEXT_PROPERTY(TextAlign, _textAlign, NSTextAlignment);
RCT_TEXT_PROPERTY(IsHighlighted, _isHighlighted, BOOL);
RCT_TEXT_PROPERTY(Font, _font, UIFont *);

- (NSLineBreakMode)truncationMode
{
  return _textContainer.lineBreakMode;
}

- (void)setTruncationMode:(NSLineBreakMode)truncationMode
{
  _textContainer.lineBreakMode = truncationMode;
  [self dirtyText];
}

- (NSUInteger)maximumNumberOfLines
{
  return _textContainer.maximumNumberOfLines;
}

- (void)setMaximumNumberOfLines:(NSUInteger)maximumNumberOfLines
{
  _textContainer.maximumNumberOfLines = maximumNumberOfLines;
  [self dirtyText];
}

@end
