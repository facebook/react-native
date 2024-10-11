/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextView.h>

#import <MobileCoreServices/UTCoreTypes.h>

#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import <React/RCTTextShadowView.h>

#import <QuartzCore/QuartzCore.h>

@interface RCTTextView () <UIEditMenuInteractionDelegate>

@property (nonatomic, nullable) UIEditMenuInteraction *editMenuInteraction API_AVAILABLE(ios(16.0));

@end

@implementation RCTTextView {
  CAShapeLayer *_highlightLayer;
  UILongPressGestureRecognizer *_longPressGestureRecognizer;

  NSArray<UIView *> *_Nullable _descendantViews;
  NSTextStorage *_Nullable _textStorage;
  CGRect _contentFrame;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }
  return self;
}

- (NSString *)description
{
  NSString *stringToAppend = [NSString stringWithFormat:@" reactTag: %@; text: %@", self.reactTag, _textStorage.string];
  return [[super description] stringByAppendingString:stringToAppend];
}

- (void)setSelectable:(BOOL)selectable
{
  if (_selectable == selectable) {
    return;
  }

  _selectable = selectable;

  if (_selectable) {
    [self enableContextMenu];
  } else {
    [self disableContextMenu];
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  // Text looks super weird if its frame is animated.
  // This disables the frame animation, without affecting opacity, etc.
  [UIView performWithoutAnimation:^{
    [super reactSetFrame:frame];
  }];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `setTextStorage:` method
}

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<UIView *> *)descendantViews
{
  _textStorage = textStorage;
  _contentFrame = contentFrame;

  // FIXME: Optimize this.
  for (UIView *view in _descendantViews) {
    [view removeFromSuperview];
  }

  _descendantViews = descendantViews;

  for (UIView *view in descendantViews) {
    [self addSubview:view];
  }

  [self setNeedsDisplay];
}

- (CGPoint)calculateDrawingPointWithTextStorage:(NSTextStorage *)textStorage
                                   contentFrame:(CGRect)contentFrame {
  if ([textStorage length] == 0) {
    return contentFrame.origin;
  }

  UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:0 effectiveRange:NULL];
  if (!font) {
      font = [UIFont systemFontOfSize:14];
  }

  NSParagraphStyle *paragraphStyle = [textStorage attribute:NSParagraphStyleAttributeName atIndex:0 effectiveRange:NULL];

  CGFloat lineHeight = font.lineHeight;
  if (paragraphStyle && paragraphStyle.minimumLineHeight > 0) {
      lineHeight = paragraphStyle.minimumLineHeight;
  }

  CGFloat ascent = font.ascender;
  CGFloat descent = fabs(font.descender);
  CGFloat textHeight = ascent + descent;

  CGFloat verticalOffset = 0;
  // Adjust vertical offset to ensure text is vertically centered relative to the line height.
  // Positive offset when text height exceeds line height, negative when line height exceeds text height.
  if (textHeight > lineHeight) {
      CGFloat difference = textHeight - lineHeight;
      verticalOffset = difference / 2.0;
  } else if (textHeight < lineHeight) {
      CGFloat difference = lineHeight - textHeight;
      verticalOffset = -(difference / 2.0);
  }

  return CGPointMake(contentFrame.origin.x, contentFrame.origin.y + verticalOffset);
}

- (void)drawRect:(CGRect)rect
{
  [super drawRect:rect];
  if (!_textStorage) {
    return;
  }

  NSLayoutManager *layoutManager = _textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

#if TARGET_OS_MACCATALYST
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);
  // NSLayoutManager tries to draw text with sub-pixel anti-aliasing by default on
  // macOS, but rendering SPAA onto a transparent background produces poor results.
  // CATextLayer disables font smoothing by default now on macOS; we follow suit.
  CGContextSetShouldSmoothFonts(context, NO);
#endif

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  if (facebook::react::ReactNativeFeatureFlags::enableLineHeightCenteringOnIOS()) {
    CGPoint drawingPoint = [self calculateDrawingPointWithTextStorage:_textStorage contentFrame:_contentFrame];
    [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:drawingPoint];
    [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:drawingPoint];
  } else {
    [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:_contentFrame.origin];
    [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:_contentFrame.origin];
  }

  __block UIBezierPath *highlightPath = nil;
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];
  [_textStorage
      enumerateAttribute:RCTTextAttributesIsHighlightedAttributeName
                 inRange:characterRange
                 options:0
              usingBlock:^(NSNumber *value, NSRange range, __unused BOOL *stop) {
                if (!value.boolValue) {
                  return;
                }

                [layoutManager
                    enumerateEnclosingRectsForGlyphRange:range
                                withinSelectedGlyphRange:range
                                         inTextContainer:textContainer
                                              usingBlock:^(CGRect enclosingRect, __unused BOOL *anotherStop) {
                                                UIBezierPath *path = [UIBezierPath
                                                    bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2)
                                                                 cornerRadius:2];
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
    _highlightLayer.position = _contentFrame.origin;
    _highlightLayer.path = highlightPath.CGPath;
  } else {
    [_highlightLayer removeFromSuperlayer];
    _highlightLayer = nil;
  }

#if TARGET_OS_MACCATALYST
  CGContextRestoreGState(context);
#endif
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
  if (_textStorage.length > 0 && (fraction > 0 || characterIndex > 0) &&
      (fraction < 1 || characterIndex < _textStorage.length - 1)) {
    reactTag = [_textStorage attribute:RCTTextAttributesTagAttributeName atIndex:characterIndex effectiveRange:NULL];
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
  } else if (_textStorage) {
    [self setNeedsDisplay];
  }
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }
  return _textStorage.string;
}

#pragma mark - Context Menu

- (void)enableContextMenu
{
  _longPressGestureRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self
                                                                              action:@selector(handleLongPress:)];
  if (@available(iOS 16.0, *)) {
    _editMenuInteraction = [[UIEditMenuInteraction alloc] initWithDelegate:self];
    [self addInteraction:_editMenuInteraction];
  }

  [self addGestureRecognizer:_longPressGestureRecognizer];
}

- (void)disableContextMenu
{
  [self removeGestureRecognizer:_longPressGestureRecognizer];

  if (@available(iOS 16.0, *)) {
    [self removeInteraction:_editMenuInteraction];
    _editMenuInteraction = nil;
  }
  _longPressGestureRecognizer = nil;
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture
{
  if (@available(iOS 16.0, macCatalyst 16.0, *)) {
    CGPoint location = [gesture locationInView:self];
    UIEditMenuConfiguration *config = [UIEditMenuConfiguration configurationWithIdentifier:nil sourcePoint:location];
    if (_editMenuInteraction) {
      [_editMenuInteraction presentEditMenuWithConfiguration:config];
    }
  } else {
    UIMenuController *menuController = [UIMenuController sharedMenuController];

    if (menuController.isMenuVisible) {
      return;
    }

    [menuController showMenuFromView:self rect:self.bounds];
  }
}

- (BOOL)canBecomeFirstResponder
{
  return _selectable;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_selectable && action == @selector(copy:)) {
    return YES;
  }

  return [self.nextResponder canPerformAction:action withSender:sender];
}

- (void)copy:(id)sender
{
  NSAttributedString *attributedText = _textStorage;

  NSMutableDictionary *item = [NSMutableDictionary new];

  NSData *rtf = [attributedText dataFromRange:NSMakeRange(0, attributedText.length)
                           documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                        error:nil];

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:attributedText.string forKey:(id)kUTTypeUTF8PlainText];

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.items = @[ item ];
}

@end
