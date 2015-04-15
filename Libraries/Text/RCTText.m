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
    _textStorage = [[NSTextStorage alloc] init];

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
  for (NSLayoutManager *existingLayoutManager in _textStorage.layoutManagers) {
    [_textStorage removeLayoutManager:existingLayoutManager];
  }

  _textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedText];

  if (_layoutManager) {
    [_textStorage addLayoutManager:_layoutManager];
  }

  [self setNeedsDisplay];
}

- (void)setTextContainer:(NSTextContainer *)textContainer
{
  if ([_textContainer isEqual:textContainer]) {
    return;
  }

  _textContainer = textContainer;

  for (NSInteger i = _layoutManager.textContainers.count - 1; i >= 0; i--) {
    [_layoutManager removeTextContainerAtIndex:i];
  }

  if (_textContainer) {
    [_layoutManager addTextContainer:_textContainer];
  }

  [self setNeedsDisplay];
}

- (void)setLayoutManager:(NSLayoutManager *)layoutManager
{
  if ([_layoutManager isEqual:layoutManager]) {
    return;
  }

  _layoutManager = layoutManager;

  for (NSLayoutManager *existingLayoutManager in _textStorage.layoutManagers) {
    [_textStorage removeLayoutManager:existingLayoutManager];
  }

  if (_layoutManager) {
    [_textStorage addLayoutManager:_layoutManager];
  }

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
  NSUInteger characterIndex = [_layoutManager characterIndexForPoint:point
                                                     inTextContainer:_textContainer
                            fractionOfDistanceBetweenInsertionPoints:&fraction];

  NSNumber *reactTag = nil;

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (_textStorage.length > 0 && (fraction > 0 || characterIndex > 0) && (fraction < 1 || characterIndex < _textStorage.length - 1)) {
    reactTag = [_textStorage attribute:RCTReactTagAttributeName atIndex:characterIndex effectiveRange:NULL];
  }

  return reactTag ?: self.reactTag;
}

@end
