/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTText.h"

#import "RCTShadowText.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTText
{
  NSLayoutManager *_layoutManager;
  NSTextStorage *_textStorage;
  NSTextContainer *_textContainer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _textContainer = [[NSTextContainer alloc] init];
    _textContainer.lineBreakMode = NSLineBreakByTruncatingTail;
    _textContainer.lineFragmentPadding = 0.0;

    _layoutManager = [[NSLayoutManager alloc] init];
    [_layoutManager addTextContainer:_textContainer];

    _textStorage = [[NSTextStorage alloc] init];
    [_textStorage addLayoutManager:_layoutManager];

    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

- (NSAttributedString *)attributedText
{
  return [_textStorage copy];
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  [_textStorage setAttributedString:attributedText];
  [self setNeedsDisplay];
}

- (NSUInteger)numberOfLines
{
  return _textContainer.maximumNumberOfLines;
}

- (void)setNumberOfLines:(NSUInteger)numberOfLines
{
  _textContainer.maximumNumberOfLines = numberOfLines;
  [self setNeedsDisplay];
}

- (NSLineBreakMode)lineBreakMode
{
  return _textContainer.lineBreakMode;
}

- (void)setLineBreakMode:(NSLineBreakMode)lineBreakMode
{
  _textContainer.lineBreakMode = lineBreakMode;
  [self setNeedsDisplay];
}

- (CGRect)textFrame
{
  return UIEdgeInsetsInsetRect(self.bounds, _contentInset);
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // The header comment for `size` says that a height of 0.0 should be enough,
  // but it isn't.
  _textContainer.size = CGSizeMake([self textFrame].size.width, CGFLOAT_MAX);
}

- (void)drawRect:(CGRect)rect
{
  CGPoint origin = [self textFrame].origin;
  NSRange glyphRange = [_layoutManager glyphRangeForTextContainer:_textContainer];
  [_layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:origin];
  [_layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:origin];
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  CGFloat fraction;
  NSUInteger characterIndex = [_layoutManager characterIndexForPoint:point inTextContainer:_textContainer fractionOfDistanceBetweenInsertionPoints:&fraction];

  NSNumber *reactTag = nil;

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (_textStorage.length > 0 && (fraction > 0 || characterIndex > 0) && (fraction < 1 || characterIndex < _textStorage.length - 1)) {
    reactTag = [_textStorage attribute:RCTReactTagAttributeName atIndex:characterIndex effectiveRange:NULL];
  }

  return reactTag ?: self.reactTag;
}

@end
