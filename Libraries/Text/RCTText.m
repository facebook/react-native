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


static CGFloat const RCTTextAutoSizeDefaultMinimumFontScale       = 0.5f;
static CGFloat const RCTTextAutoSizeWidthErrorMargin              = 0.05f;
static CGFloat const RCTTextAutoSizeGranularity                   = 0.001f;

static void collectNonTextDescendants(RCTText *view, NSMutableArray *nonTextDescendants)
{
  for (UIView *child in view.reactSubviews) {
    if ([child isKindOfClass:[RCTText class]]) {
      collectNonTextDescendants((RCTText *)child, nonTextDescendants);
    } else if (!CGRectEqualToRect(child.frame, CGRectZero)) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface RCTText ()

@property (nonatomic, strong) NSAttributedString *originalString;
@property (nonatomic, assign) CGRect textFrame;

@end


@implementation RCTText
{
  NSTextStorage *_textStorage;
  CAShapeLayer *_highlightLayer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _textStorage = [NSTextStorage new];

    _minimumFontScale = RCTTextAutoSizeDefaultMinimumFontScale;
    _adjustsFontSizeToFit = NO;

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

- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
  self.backgroundColor = inheritedBackgroundColor;
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `setTextStorage:` method
}

- (void)setTextStorage:(NSTextStorage *)textStorage
{
  if (_textStorage != textStorage) {
    _textStorage = textStorage;

    // Update subviews
    NSMutableArray *nonTextDescendants = [NSMutableArray new];
    collectNonTextDescendants(self, nonTextDescendants);
    NSArray *subviews = self.subviews;
    if (![subviews isEqualToArray:nonTextDescendants]) {
      for (UIView *child in subviews) {
        if (![nonTextDescendants containsObject:child]) {
          [child removeFromSuperview];
        }
      }
      for (UIView *child in nonTextDescendants) {
        [self addSubview:child];
      }
    }

    [self setNeedsDisplay];
  }

  _textStorage = textStorage;
  //This produces an NSMutableAttributedString and not an NSTextStorage
  //(Perhaps resolve by doing this on purpose instead of via this mutableCopy side effect?)
  _originalString = [textStorage mutableCopy];
  [self calculateTextFrame];
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  [self calculateTextFrame];
}

- (void)drawRect:(CGRect)rect
{
  NSLayoutManager *layoutManager = [_textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:self.textFrame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:self.textFrame.origin];

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
  NSLayoutManager *layoutManager = _textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
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

#pragma mark Autosizing

- (void)calculateTextFrame
{
  self.textFrame = UIEdgeInsetsInsetRect(self.bounds, _contentInset);
  if (_adjustsFontSizeToFit) {
    self.textFrame = [self updateToFitFrame:self.textFrame];
  }

  [self setNeedsDisplay];
}

- (CGRect)updateToFitFrame:(CGRect)frame
{
  [self resetDrawnTextStorage];

  BOOL fits = [self attemptScale:1.0f
                      forFrame:frame];
  CGSize requiredSize;
  if (!fits) {
    requiredSize = [self calculateOptimumScaleInFrame:frame
                                             minScale:self.minimumFontScale
                                             maxScale:1.0
                                              prevMid:INT_MAX];
  } else {
    requiredSize = [self calculateSize:_textStorage];
  }

  //Vertically center draw position
  frame.origin.y = _contentInset.top + RCTRoundPixelValue((CGRectGetHeight(frame) - requiredSize.height) / 2.0f);
  return frame;
}

- (CGSize)calculateOptimumScaleInFrame:(CGRect)frame
                              minScale:(CGFloat)minScale
                              maxScale:(CGFloat)maxScale
                               prevMid:(CGFloat)prevMid
{
  CGFloat midScale = (minScale + maxScale) / 2.0f;
  if (round((prevMid / RCTTextAutoSizeGranularity)) == round((midScale / RCTTextAutoSizeGranularity))) {
    //Bail because we can't meet error margin.
    return [self calculateSize:_textStorage];
  } else {
    RCTSizeComparison comparison = [self attemptScale:midScale forFrame:frame];
    if (comparison == RCTSizeWithinRange) {
      return [self calculateSize:_textStorage];
    } else if (comparison == RCTSizeTooLarge) {
      return [self calculateOptimumScaleInFrame:frame
                                       minScale:minScale
                                       maxScale:midScale - RCTTextAutoSizeGranularity
                                        prevMid:midScale];
    } else {
      return [self calculateOptimumScaleInFrame:frame
                                       minScale:midScale + RCTTextAutoSizeGranularity
                                       maxScale:maxScale
                                        prevMid:midScale];
    }
  }
}

- (RCTSizeComparison)attemptScale:(CGFloat)scale
                       forFrame:(CGRect)frame
{
  NSLayoutManager *layoutManager = [_textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];

  NSRange glyphRange = NSMakeRange(0, _textStorage.length);
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
       UIFont *newFont = [font fontWithSize:originalFont.pointSize * scale];
       [_textStorage removeAttribute:NSFontAttributeName range:range];
       [_textStorage addAttribute:NSFontAttributeName value:newFont range:range];
     }
   }];

  [_textStorage endEditing];

  NSInteger linesRequired = [self numberOfLinesRequired:[_textStorage.layoutManagers firstObject]];
  CGSize requiredSize = [self calculateSize:_textStorage];

  BOOL fitSize = requiredSize.height <= CGRectGetHeight(frame) &&
                 requiredSize.width <= CGRectGetWidth(frame);

  BOOL fitLines = linesRequired <= textContainer.maximumNumberOfLines ||
                                   textContainer.maximumNumberOfLines == 0;

  if (fitLines && fitSize) {
    if ((requiredSize.width + (CGRectGetWidth(frame) * RCTTextAutoSizeWidthErrorMargin)) > CGRectGetWidth(frame))
    {
      return RCTSizeWithinRange;
    } else {
      return RCTSizeTooSmall;
    }
  } else {
    return RCTSizeTooLarge;
  }
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

  [textContainer setLineBreakMode:NSLineBreakByWordWrapping];
  NSInteger maxLines = [textContainer maximumNumberOfLines];
  [textContainer setMaximumNumberOfLines:0];
  (void) [layoutManager glyphRangeForTextContainer:textContainer];
  CGSize requiredSize = [layoutManager usedRectForTextContainer:textContainer].size;
  [textContainer setMaximumNumberOfLines:maxLines];

  return requiredSize;
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

- (void)setMinimumFontScale:(CGFloat)minimumFontScale
{
  if (minimumFontScale > 0.0) {
    _minimumFontScale = minimumFontScale;
  }
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  return _textStorage.string;
}

@end
