/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextView.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
#import <MobileCoreServices/UTCoreTypes.h>
#else
#import <Quartz/Quartz.h> // TODO(macOS GH#774) for CATiledLayer
#endif // TODO(macOS GH#774)

#import <React/RCTAssert.h> // TODO(macOS GH#774)
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <React/RCTFocusChangeEvent.h> // TODO(OSS Candidate ISS#2710739)

#import <React/RCTTextShadowView.h>

#import <QuartzCore/QuartzCore.h> // TODO(macOS GH#774)

@implementation RCTTextView
{
  CAShapeLayer *_highlightLayer;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UILongPressGestureRecognizer *_longPressGestureRecognizer;
#else // [TODO(macOS GH#774)
  NSString * _accessibilityLabel;
#endif // ]TODO(macOS GH#774)

  RCTEventDispatcher *_eventDispatcher; // TODO(OSS Candidate ISS#2710739)
  NSArray<RCTUIView *> *_Nullable _descendantViews; // TODO(macOS ISS#3536887)
  NSTextStorage *_Nullable _textStorage;
  CGRect _contentFrame;
}

// [TODO(OSS Candidate ISS#2710739)
- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [self initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
  }
  return self;
}
// ]TODO(OSS Candidate ISS#2710739)

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
#else // [TODO(macOS GH#774)
    self.accessibilityRole = NSAccessibilityStaticTextRole;
#endif // ]TODO(macOS GH#774)
    self.opaque = NO;
    RCTUIViewSetContentModeRedraw(self); // TODO(macOS GH#774) and TODO(macOS ISS#3536887)
  }
  return self;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)dealloc
{
  [self removeAllTextStorageLayoutManagers];
}

- (void)removeAllTextStorageLayoutManagers
{
  // On macOS AppKit can throw an uncaught exception
  // (-[NSConcretePointerArray pointerAtIndex:]: attempt to access pointer at index ...)
  // during the dealloc of NSLayoutManager.  The _textStorage and its
  // associated NSLayoutManager dealloc later in an autorelease pool.
  // Manually removing the layout managers from _textStorage prior to release
  // works around this issue in AppKit.
  NSArray<NSLayoutManager *> *managers = [[_textStorage layoutManagers] copy];
  for (NSLayoutManager *manager in managers) {
    [_textStorage removeLayoutManager:manager];
  }
}

- (BOOL)canBecomeKeyView
{
	// RCTText should not get any keyboard focus unless its `selectable` prop is true
	return _selectable;
}

- (void)drawFocusRingMask {
  if ([self enableFocusRing]) {
    NSRectFill([self bounds]);
  }
}

- (NSRect)focusRingMaskBounds {
  return [self bounds];
}
#endif // ]TODO(macOS GH#774)

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  NSString *replacement = [NSString stringWithFormat:@"; reactTag: %@; text: %@", self.reactTag, _textStorage.string];
  // TODO(macOS GH#774): super.description isn't guaranteed to have a semicolon in it on macOS
  if (semicolonRange.location == NSNotFound) {
    return [superDescription stringByAppendingString:replacement];
  } else {
    return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
  }
}

- (void)setSelectable:(BOOL)selectable
{
  if (_selectable == selectable) {
    return;
  }

  _selectable = selectable;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (_selectable) {
    [self enableContextMenu];
  }
  else {
    [self disableContextMenu];
  }
#endif // TODO(macOS GH#774)
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)reactSetFrame:(CGRect)frame
{
  // Text looks super weird if its frame is animated.
  // This disables the frame animation, without affecting opacity, etc.
  [UIView performWithoutAnimation:^{
    [super reactSetFrame:frame];
  }];
}
#endif // TODO(macOS GH#774)

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `setTextStorage:` method
}

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<RCTUIView *> *)descendantViews // TODO(macOS ISS#3536887)
{
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  [self removeAllTextStorageLayoutManagers];
#endif // ]TODO(macOS GH#774)

  _textStorage = textStorage;
  _contentFrame = contentFrame;

  // FIXME: Optimize this.
  for (RCTUIView *view in _descendantViews) { // TODO(macOS ISS#3536887)
    [view removeFromSuperview];
  }

  _descendantViews = descendantViews;

  for (RCTUIView *view in descendantViews) { // TODO(macOS ISS#3536887)
    [self addSubview:view];
  }

  [self setNeedsDisplay];
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
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange
                                                     actualGlyphRange:NULL];
  // [TODO(OSS Candidate ISS#2710739)
  [_textStorage enumerateAttribute:RCTTextAttributesFontSmoothingAttributeName
                           inRange:characterRange
                           options:0
                        usingBlock:
    ^(NSNumber *value, NSRange range, __unused BOOL *stop) {
    RCTFontSmoothing smoothing = value.integerValue;
    if (smoothing == RCTFontSmoothingAuto) {
      smoothing = [RCTTextAttributes fontSmoothingDefault];
    }
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSaveGState(context);
    switch (smoothing) {
      case RCTFontSmoothingNone:
        CGContextSetShouldAntialias(context, false);
        break;
      case RCTFontSmoothingAntialiased:
        CGContextSetAllowsFontSmoothing(context, false);
        CGContextSetShouldSmoothFonts(context, false);
        break;
      case RCTFontSmoothingAuto:
      case RCTFontSmoothingSubpixelAntialiased:
        break;
    }
    NSRange subGlyphRange = [layoutManager glyphRangeForCharacterRange:range actualCharacterRange:nil];
    [layoutManager drawBackgroundForGlyphRange:subGlyphRange atPoint:_contentFrame.origin];
    [layoutManager drawGlyphsForGlyphRange:subGlyphRange atPoint:_contentFrame.origin];
    CGContextRestoreGState(context);
  }];
  // ]TODO(OSS Candidate ISS#2710739)

  __block UIBezierPath *highlightPath = nil;
  [_textStorage enumerateAttribute:RCTTextAttributesIsHighlightedAttributeName
                           inRange:characterRange
                           options:0
                        usingBlock:
    ^(NSNumber *value, NSRange range, __unused BOOL *stop) {
      if (!value.boolValue) {
        return;
      }

      [layoutManager enumerateEnclosingRectsForGlyphRange:range
                                 withinSelectedGlyphRange:range
                                          inTextContainer:textContainer
                                               usingBlock:
        ^(CGRect enclosingRect, __unused BOOL *anotherStop) {
#if !TARGET_OS_OSX // TODO(macOS ISS#3536887)
        UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2) cornerRadius:2];
#else // TODO(macOS ISS#3536887)
        NSBezierPath *path = [NSBezierPath bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2) xRadius:2 yRadius:2];
#endif // TODO(macOS ISS#3536887)
          if (highlightPath) {
            UIBezierPathAppendPath(highlightPath, path); // TODO(macOS GH#774)
          } else {
            highlightPath = path;
          }
        }
      ];
  }];

  if (highlightPath) {
    if (!_highlightLayer) {
      _highlightLayer = [CAShapeLayer layer];
      _highlightLayer.fillColor = [RCTUIColor colorWithWhite:0 alpha:0.25].CGColor; // TODO(OSS Candidate ISS#2710739)
      [self.layer addSublayer:_highlightLayer];
    }
    _highlightLayer.position = _contentFrame.origin;
    _highlightLayer.path = UIBezierPathCreateCGPathRef(highlightPath); // TODO(macOS GH#774)
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
  if (_textStorage.length > 0 && (fraction > 0 || characterIndex > 0) && (fraction < 1 || characterIndex < _textStorage.length - 1)) {
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

#if TARGET_OS_OSX // [TODO(macOS GH#774)

// This code is here to cover for a mismatch in the what accessibilityLabels and accessibilityValues mean in iOS versus macOS.
// In macOS a text element will always read its accessibilityValue, but will only read it's accessibilityLabel if it's value is set.
// In iOS a text element will only read it's accessibilityValue if it has no accessibilityLabel, and will always read its accessibilityLabel.
// This code replicates the expected behavior in macOS by:
// 1) Setting the accessibilityValue = the react-native accessibilityLabel prop if one exists and setting it equal to the text's contents otherwise.
// 2) Making sure that its accessibilityLabel is always nil, so that it doesn't read out the label twice.

- (void)setAccessibilityLabel:(NSString *)label
{
  _accessibilityLabel = [label copy];
}

- (NSString *)accessibilityValue
{
  if (_accessibilityLabel) {
    return _accessibilityLabel;
  }
  return _textStorage.string;
}
#else // ]TODO(macOS GH#774)
- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }
  return _textStorage.string;
}
#endif // TODO(macOS GH#774)

#pragma mark - Context Menu

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)enableContextMenu
{
  _longPressGestureRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleLongPress:)];
  [self addGestureRecognizer:_longPressGestureRecognizer];
}

- (void)disableContextMenu
{
  [self removeGestureRecognizer:_longPressGestureRecognizer];
  _longPressGestureRecognizer = nil;
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture
{
  // TODO: Adopt showMenuFromRect (necessary for UIKitForMac)
#if !TARGET_OS_UIKITFORMAC
  UIMenuController *menuController = [UIMenuController sharedMenuController];

  if (menuController.isMenuVisible) {
    return;
  }

  if (!self.isFirstResponder) {
    [self becomeFirstResponder];
  }

  [menuController setTargetRect:self.bounds inView:self];
  [menuController setMenuVisible:YES animated:YES];
#endif
}
#else // [TODO(macOS GH#774)

- (void)rightMouseDown:(NSEvent *)event
{
  if (_selectable == NO) {
    [super rightMouseDown:event];
    return;
  }
  NSText *fieldEditor = [self.window fieldEditor:YES forObject:self];
  NSMenu *fieldEditorMenu = [fieldEditor menuForEvent:event];

  RCTAssert(fieldEditorMenu, @"Unable to obtain fieldEditor's context menu");

  if (fieldEditorMenu) {
    NSMenu *menu = [[NSMenu alloc] initWithTitle:@""];

    for (NSMenuItem *fieldEditorMenuItem in fieldEditorMenu.itemArray) {
      if (fieldEditorMenuItem.action == @selector(copy:)) {
        NSMenuItem *item = [fieldEditorMenuItem copy];

        item.target = self;
        [menu addItem:item];

        break;
      }
    }

    RCTAssert(menu.numberOfItems > 0, @"Unable to create context menu with \"Copy\" item");

    if (menu.numberOfItems > 0) {
      [NSMenu popUpContextMenu:menu withEvent:event forView:self];
    }
  }
}

- (BOOL)becomeFirstResponder
{
  if (![super becomeFirstResponder]) {
    return NO;
  }

  // If we've gained focus, notify listeners
  [_eventDispatcher sendEvent:[RCTFocusChangeEvent focusEventWithReactTag:self.reactTag]];

  return YES;
}

- (BOOL)resignFirstResponder
{
  if (![super resignFirstResponder]) {
    return NO;
  }

  // If we've lost focus, notify listeners
  [_eventDispatcher sendEvent:[RCTFocusChangeEvent blurEventWithReactTag:self.reactTag]];

  return YES;
}

#endif // ]TODO(macOS GH#774)

- (BOOL)canBecomeFirstResponder
{
  return _selectable;
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_selectable && action == @selector(copy:)) {
    return YES;
  }

  return [self.nextResponder canPerformAction:action withSender:sender];
}
#endif // TODO(macOS GH#774)

- (void)copy:(id)sender
{
  NSAttributedString *attributedText = _textStorage;

  NSData *rtf = [attributedText dataFromRange:NSMakeRange(0, attributedText.length)
                           documentAttributes:@{NSDocumentTypeDocumentAttribute: NSRTFDTextDocumentType}
                                        error:nil];
#if TARGET_OS_IPHONE // TODO(macOS GH#774)
  NSMutableDictionary *item = [NSMutableDictionary new]; // TODO(macOS GH#774)

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:attributedText.string forKey:(id)kUTTypeUTF8PlainText];

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.items = @[item];
#elif TARGET_OS_OSX // TODO(macOS GH#774)
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard writeObjects:[NSArray arrayWithObjects:attributedText.string, rtf, nil]];
#endif // TODO(macOS GH#774)
}

@end
