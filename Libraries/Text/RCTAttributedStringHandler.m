/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAttributedStringHandler.h"

#import "RCTConvert.h"
#import "RCTUtils.h"
#import "RCTShadowView.h"

@implementation RCTAttributedStringHandler {
  UIFont *_font;
  RCTShadowView *_shadowView;
}

-(instancetype)initWithShadowView:(RCTShadowView *)shadowView;
{
  if ((self = [super init])) {
    _fontSize = NAN;
    _isHighlighted = NO;
    _shadowView = shadowView;
  }
  
  return self;
}

- (NSAttributedString *)attributedString:(NSString *)stringToProcess
{
  return [self _attributedString:stringToProcess
                  WithFontFamily:nil
                        fontSize:0
                      fontWeight:nil
                       fontStyle:nil ];
}

- (NSAttributedString *)_attributedString:(NSString *)stringToProcess
                           WithFontFamily:(NSString *)fontFamily
                                 fontSize:(CGFloat)fontSize
                               fontWeight:(NSString *)fontWeight
                                fontStyle:(NSString *)fontStyle

{
  if (!stringToProcess) {
    return [[NSAttributedString alloc]init];
  }
  if ( _fontSize && !isnan(_fontSize)) {
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
  
  NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc]initWithString:stringToProcess];
  
  if (_textColor) {
    [self _addAttribute:NSForegroundColorAttributeName withValue:self.textColor toAttributedString:attributedString];
  }
  if (_isHighlighted) {
    [self _addAttribute:@"IsHighlightedAttributeName" withValue:@YES toAttributedString:attributedString];
  }
  if (_textBackgroundColor) {
    [self _addAttribute:NSBackgroundColorAttributeName withValue:self.textBackgroundColor toAttributedString:attributedString];
  }
  
  _font = [RCTConvert UIFont:nil withFamily:fontFamily size:@(fontSize) weight:fontWeight style:fontStyle];
  [self _addAttribute:NSFontAttributeName withValue:_font toAttributedString:attributedString];
  [self _addAttribute:@"IsHighlightedAttributeName" withValue:_shadowView.reactTag toAttributedString:attributedString];
  [self _setParagraphStyleOnAttributedString:attributedString];

  // create a non-mutable attributedString for use by the Text system which avoids copies down the line
  _cachedAttributedString = [[NSAttributedString alloc] initWithAttributedString:attributedString];
  
  return _cachedAttributedString;
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

@end
