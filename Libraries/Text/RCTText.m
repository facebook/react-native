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

@interface RCTText ()

@property NSAttributedString *originalString;

@end

@implementation RCTText
{
  NSTextStorage *_textStorage;
  NSMutableArray *_reactSubviews;
  CAShapeLayer *_highlightLayer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _textStorage = [[NSTextStorage alloc] init];
    _reactSubviews = [NSMutableArray array];
    _minimumFontScale = .5;
    _adjustsFontSizeToFitWidth = YES;
    
    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;

    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }
  return self;
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  NSString *replacement = [NSString stringWithFormat:@"; reactTag: %@; text: %@", self.reactTag, self.textStorage.string];
  return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
}

- (void)reactSetFrame:(CGRect)frame
{
  // Text looks super weird if its frame is animated.
  // This disables the frame animation, without affecting opacity, etc.
  [UIView performWithoutAnimation:^{
    [super reactSetFrame:frame];
  }];
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [_reactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(UIView *)subview
{
  [_reactSubviews removeObject:subview];
}

- (NSArray *)reactSubviews
{
  return _reactSubviews;
}

- (void)setTextStorage:(NSTextStorage *)textStorage
{
  _textStorage = textStorage;
  //This produces an NSMutableAttributedString and not an NSTextStorage
  //(Perhaps resolve by doing this on purpose instead of via this mutableCopy side effect?)
  _originalString = [textStorage mutableCopy];

  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  NSLayoutManager *layoutManager = [_textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, _contentInset);
  if (_adjustsFontSizeToFitWidth) {
    textFrame = [self updateToFitFrame:textFrame];
  }

  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:textFrame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:textFrame.origin];

  __block UIBezierPath *highlightPath = nil;
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];
  [layoutManager.textStorage enumerateAttribute:RCTIsHighlightedAttributeName inRange:characterRange options:0 usingBlock:^(NSNumber *value, NSRange range, BOOL *_) {
    if (!value.boolValue) {
      return;
    }

    [layoutManager enumerateEnclosingRectsForGlyphRange:range withinSelectedGlyphRange:range inTextContainer:textContainer usingBlock:^(CGRect enclosingRect, __unused BOOL *__) {
      UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2) cornerRadius:2];
      if (highlightPath) {
        [highlightPath appendPath:path];
      } else {
        highlightPath = path;
      }
    }];
  }];

  if (highlightPath) {
    if (!_highlightLayer) {
      _highlightLayer = [CAShapeLayer layer];
      _highlightLayer.fillColor = [UIColor colorWithWhite:0 alpha:0.25].CGColor;
      [self.layer addSublayer:_highlightLayer];
    }
    _highlightLayer.position = (CGPoint){_contentInset.left, _contentInset.top};
    _highlightLayer.path = highlightPath.CGPath;
  } else {
    [_highlightLayer removeFromSuperlayer];
    _highlightLayer = nil;
  }
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  NSNumber *reactTag = self.reactTag;

  CGFloat fraction;
  NSLayoutManager *layoutManager = [_textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];
  NSUInteger characterIndex = [layoutManager characterIndexForPoint:point
                                                    inTextContainer:textContainer
                           fractionOfDistanceBetweenInsertionPoints:&fraction];

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (_textStorage.length > 0 && (fraction > 0 || characterIndex > 0) && (fraction < 1 || characterIndex < _textStorage.length - 1)) {
    reactTag = [_textStorage attribute:RCTReactTagAttributeName atIndex:characterIndex effectiveRange:NULL];
  }
  return reactTag;
}


- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!self.window) {
    self.layer.contents = nil;
    if (_highlightLayer) {
      [_highlightLayer removeFromSuperlayer];
      _highlightLayer = nil;
    }
  } else if (_textStorage.length) {
    [self setNeedsDisplay];
  }
}

#pragma mark Sizing

- (CGRect)updateToFitFrame:(CGRect)frame
{
  NSLayoutManager *layoutManager = [_textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];
  [textContainer setLineBreakMode:NSLineBreakByWordWrapping];
  
  NSRange glyphRange = NSMakeRange(0, _textStorage.length);

  [self resetDrawnTextStorage];

  CGSize requiredSize = [self calculateSize:_textStorage];
  NSInteger linesRequired = [self numberOfLinesRequired:layoutManager];

  __block BOOL hitMinimumScale = NO;
  while ((requiredSize.height > CGRectGetHeight(frame) ||
         requiredSize.width > CGRectGetWidth(frame) ||
         (linesRequired > textContainer.maximumNumberOfLines &&
          textContainer.maximumNumberOfLines != 0))
         && !hitMinimumScale)
  {
    [_textStorage beginEditing];
    [_textStorage enumerateAttribute:NSFontAttributeName
                             inRange:glyphRange
                             options:0
                          usingBlock:^(UIFont *font, NSRange range, BOOL *stop)
    {
      if (font) {
        UIFont *originalFont = [_originalString attribute:NSFontAttributeName
                                                  atIndex:range.location
                                           effectiveRange:&range];
        UIFont *newFont = [font fontWithSize:font.pointSize - .5];
        if (newFont.pointSize > originalFont.pointSize * self.minimumFontScale) {
          [_textStorage removeAttribute:NSFontAttributeName range:range];
          [_textStorage addAttribute:NSFontAttributeName value:newFont range:range];
        } else {
          hitMinimumScale = YES;
        }
      }
    }];
    [_textStorage endEditing];

    linesRequired = [self numberOfLinesRequired:layoutManager];
    requiredSize = [self calculateSize:_textStorage];
  }

  //Vertically center draw position
  frame.origin.y = _contentInset.top + round((CGRectGetHeight(frame) - requiredSize.height) / 2);
  return frame;
}

// Via Apple Text Layout Programming Guide
// https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/TextLayout/Tasks/CountLines.html
- (NSInteger)numberOfLinesRequired:(NSLayoutManager *)layoutManager
{
  NSInteger numberOfLines, index, numberOfGlyphs = [layoutManager numberOfGlyphs];
  NSRange lineRange;
  for (numberOfLines = 0, index = 0; index < numberOfGlyphs; numberOfLines++){
    (void) [layoutManager lineFragmentRectForGlyphAtIndex:index
                                           effectiveRange:&lineRange];
    index = NSMaxRange(lineRange);
  }

  return numberOfLines;
}

// Via Apple Text Layout Programming Guide
//https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/TextLayout/Tasks/StringHeight.html
- (CGSize)calculateSize:(NSTextStorage *)storage
{
  NSLayoutManager *layoutManager = [storage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];
  (void) [layoutManager glyphRangeForTextContainer:textContainer];
  return [layoutManager usedRectForTextContainer:textContainer].size;
}

//Start fresh with the original drawn string each time, in case frame has gotten larger
- (void)resetDrawnTextStorage
{
  [_textStorage beginEditing];

  NSRange originalRange = NSMakeRange(0, _originalString.length);
  [_textStorage setAttributes:@{} range:originalRange];

  [_originalString enumerateAttributesInRange:originalRange
                                      options:0
                                   usingBlock:^(NSDictionary *attrs, NSRange range, BOOL *stop)
  {
    [_textStorage setAttributes:attrs range:range];
  }];

  [_textStorage endEditing];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  return _textStorage.string;
}

@end
