/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextView.h>

#if !TARGET_OS_OSX // [macOS]
#import <MobileCoreServices/UTCoreTypes.h>
#endif // [macOS]

#import <React/RCTAssert.h> // [macOS]
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <React/RCTFocusChangeEvent.h> // [macOS]

#import <React/RCTTextShadowView.h>
#import <React/RCTTouchHandler.h>

#import <QuartzCore/QuartzCore.h>

#if TARGET_OS_OSX // [macOS

// We are managing the key view loop using the RCTTextView.
// Disable key view for backed NSTextView so we don't get double focus.
@interface RCTUnfocusableTextView : NSTextView
@end

@implementation RCTUnfocusableTextView

- (BOOL)canBecomeKeyView
{
  return NO;
}

@end

@interface RCTTextView () <NSTextViewDelegate>
@end

#endif // macOS]

#import <QuartzCore/QuartzCore.h>

@implementation RCTTextView {
  CAShapeLayer *_highlightLayer;
#if !TARGET_OS_OSX // [macOS]
  UILongPressGestureRecognizer *_longPressGestureRecognizer;
#else // [macOS
  NSString * _accessibilityLabel;
  NSTextView *_textView;
#endif // macOS]

  id<RCTEventDispatcherProtocol> _eventDispatcher; // [macOS]
  NSArray<RCTUIView *> *_Nullable _descendantViews; // [macOS]
  NSTextStorage *_Nullable _textStorage;
  CGRect _contentFrame;
}

// [macOS
- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  if ((self = [self initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
  }
  return self;
}
// macOS]

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
#if !TARGET_OS_OSX // [macOS]
    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
    self.opaque = NO;
#else // [macOS
    self.accessibilityRole = NSAccessibilityStaticTextRole;
    // Fix blurry text on non-retina displays.
    self.canDrawSubviewsIntoLayer = YES;
    // The NSTextView is responsible for drawing text and managing selection.
    _textView = [[RCTUnfocusableTextView alloc] initWithFrame:self.bounds];
    _textView.delegate = self;
    _textView.usesFontPanel = NO;
    _textView.drawsBackground = NO;
    _textView.linkTextAttributes = @{};
    _textView.editable = NO;
    _textView.selectable = NO;
    _textView.verticallyResizable = NO;
    _textView.layoutManager.usesFontLeading = NO;
    _textStorage = _textView.textStorage;
    [self addSubview:_textView];
#endif // macOS]
    RCTUIViewSetContentModeRedraw(self); // [macOS]
  }
  return self;
}

#if DEBUG // [macOS] description is a debug-only feature
- (NSString *)description
{
  NSString *stringToAppend = [NSString stringWithFormat:@" reactTag: %@; text: %@", self.reactTag, _textStorage.string];
  return [[super description] stringByAppendingString:stringToAppend];
}
#endif // [macOS]

- (void)setSelectable:(BOOL)selectable
{
  if (_selectable == selectable) {
    return;
  }

  _selectable = selectable;

#if !TARGET_OS_OSX // [macOS]
  if (_selectable) {
    [self enableContextMenu];
  } else {
    [self disableContextMenu];
  }
#else // [macOS
  _textView.selectable = _selectable;
  if (_selectable) {
    [self setFocusable:YES];
  }
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
- (void)reactSetFrame:(CGRect)frame
{
  // Text looks super weird if its frame is animated.
  // This disables the frame animation, without affecting opacity, etc.
  [UIView performWithoutAnimation:^{
    [super reactSetFrame:frame];
  }];
}
#endif // [macOS]

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `setTextStorage:` method
}

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<RCTUIView *> *)descendantViews // [macOS]
{
  // This lets the textView own its text storage on macOS
  // We update and replace the text container `_textView.textStorage.attributedString` when text/layout changes
#if !TARGET_OS_OSX // [macOS]
  _textStorage = textStorage;
#endif // [macOS]

  _contentFrame = contentFrame;

#if TARGET_OS_OSX // [macOS
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  [_textView replaceTextContainer:textContainer];

  // On macOS AppKit can throw an uncaught exception
  // (-[NSConcretePointerArray pointerAtIndex:]: attempt to access pointer at index ...)
  // during the dealloc of NSLayoutManager.  The textStorage and its
  // associated NSLayoutManager dealloc later in an autorelease pool.
  // Manually removing the layout managers from textStorage prior to release
  // works around this issue in AppKit.
  NSArray<NSLayoutManager *> *managers = [[textStorage layoutManagers] copy];
  for (NSLayoutManager *manager in managers) {
    [textStorage removeLayoutManager:manager];
  }

  _textView.minSize = contentFrame.size;
  _textView.maxSize = contentFrame.size;
  _textView.frame = contentFrame;
  _textView.textStorage.attributedString = textStorage;
#endif // macOS]

  // FIXME: Optimize this.
  for (RCTUIView *view in _descendantViews) { // [macOS]
    [view removeFromSuperview];
  }

  _descendantViews = descendantViews;

  for (RCTUIView *view in descendantViews) { // [macOS]
    [self addSubview:view];
  }

  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  [super drawRect:rect];

  // For iOS, UITextView api is not used for legacy performance reasons. A custom draw implementation is used instead.
  // On desktop, we use NSTextView to access api's for arbitrary selection, custom cursors etc...
#if TARGET_OS_OSX // [macOS
  return;
#endif // macOS]

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
  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:_contentFrame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:_contentFrame.origin];

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
                                                // [macOS
                                                UIBezierPath *path = UIBezierPathWithRoundedRect(
                                                  CGRectInset(enclosingRect, -2, -2), 
                                                  2); 
                                                // [macOS]
                                                if (highlightPath) {
#if !TARGET_OS_OSX // [macOS]
                                                  [highlightPath appendPath:path];
#else // [macOS
                                                  [highlightPath appendBezierPath:path];
#endif // macOS]
                                                } else {
                                                  highlightPath = path;
                                                }
                                              }];
              }];

  if (highlightPath) {
    if (!_highlightLayer) {
      _highlightLayer = [CAShapeLayer layer];
      _highlightLayer.fillColor = [RCTUIColor colorWithWhite:0 alpha:0.25].CGColor; // [macOS]
      [self.layer addSublayer:_highlightLayer];
    }
    _highlightLayer.position = _contentFrame.origin;
    _highlightLayer.path = UIBezierPathCreateCGPathRef(highlightPath); // [macOS]
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

#if !TARGET_OS_OSX // [macOS]
- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }
  return _textStorage.string;
}
#else // [macOS

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
#endif // macOS]

#pragma mark - Context Menu

#if !TARGET_OS_OSX // [macOS]
- (void)enableContextMenu
{
  _longPressGestureRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self
                                                                              action:@selector(handleLongPress:)];
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
#else // [macOS

- (NSView *)hitTest:(NSPoint)point
{
  // We will forward mouse click events to the NSTextView ourselves to prevent NSTextView from swallowing events that may be handled in JS (e.g. long press).
  NSView *hitView = [super hitTest:point];
  
  NSEventType eventType = NSApp.currentEvent.type;
  BOOL isMouseClickEvent = NSEvent.pressedMouseButtons > 0;
  BOOL isMouseMoveEventType = eventType == NSEventTypeMouseMoved || eventType == NSEventTypeMouseEntered || eventType == NSEventTypeMouseExited || eventType == NSEventTypeCursorUpdate;
  BOOL isMouseMoveEvent = !isMouseClickEvent && isMouseMoveEventType;
  BOOL isTextViewClick = (hitView && hitView == _textView) && !isMouseMoveEvent;
  
  return isTextViewClick ? self : hitView;
}

- (void)rightMouseDown:(NSEvent *)event
{

  if (self.selectable == NO) {
    [super rightMouseDown:event];
    return;
  }

  [[RCTTouchHandler touchHandlerForView:self] cancelTouchWithEvent:event];
  [_textView rightMouseDown:event];
}

- (void)mouseDown:(NSEvent *)event
{
  if (!self.selectable) {
    [super mouseDown:event];
    return;
  }

  // Double/triple-clicks should be forwarded to the NSTextView.
  BOOL shouldForward = event.clickCount > 1;

  if (!shouldForward) {
    // Peek at next event to know if a selection should begin.
    NSEvent *nextEvent = [self.window nextEventMatchingMask:NSEventMaskLeftMouseUp | NSEventMaskLeftMouseDragged
                                                  untilDate:[NSDate distantFuture]
                                                     inMode:NSEventTrackingRunLoopMode
                                                    dequeue:NO];
    shouldForward = nextEvent.type == NSEventTypeLeftMouseDragged;
  }

  if (shouldForward) {
    NSView *contentView = self.window.contentView;
    // -[NSView hitTest:] takes coordinates in a view's superview coordinate system.
    NSPoint point = [contentView.superview convertPoint:event.locationInWindow fromView:nil];

    // Start selection if we're still selectable and hit-testable.
    if (self.selectable && [contentView hitTest:point] == self) {
      [[RCTTouchHandler touchHandlerForView:self] cancelTouchWithEvent:event];
      [self.window makeFirstResponder:_textView];
      [_textView mouseDown:event];
    }
  } else {
    // Clear selection for single clicks.
    _textView.selectedRange = NSMakeRange(NSNotFound, 0);
  }
}
#endif // macOS]

#pragma mark - Selection

#if TARGET_OS_OSX // [macOS
- (void)textDidEndEditing:(NSNotification *)notification
{
  _textView.selectedRange = NSMakeRange(NSNotFound, 0);
}
#endif // macOS]

#pragma mark - Responder chain

#if !TARGET_OS_OSX // [macOS]
- (BOOL)canBecomeFirstResponder
{
  return _selectable;
}
#else // [macOS
- (BOOL)canBecomeKeyView
{
  return self.focusable;
}

- (void)drawFocusRingMask {
  if (self.focusable && self.enableFocusRing) {
    NSRectFill([self bounds]);
  }
}

- (NSRect)focusRingMaskBounds {
  return [self bounds];
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
  //  Don't relinquish first responder while selecting text.
  if (_selectable && NSRunLoop.currentRunLoop.currentMode == NSEventTrackingRunLoopMode) {
    return NO;
  }
  
  return [super resignFirstResponder];
}

- (BOOL)canBecomeFirstResponder
{
  return self.focusable;
}
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_selectable && action == @selector(copy:)) {
    return YES;
  }

  return [self.nextResponder canPerformAction:action withSender:sender];
}
#endif // [macOS]

#pragma mark - Copy/Paste

- (void)copy:(id)sender
{
  NSAttributedString *attributedText = _textStorage;

  NSData *rtf = [attributedText dataFromRange:NSMakeRange(0, attributedText.length)
                           documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                        error:nil];
#if !TARGET_OS_OSX // [macOS]
  NSMutableDictionary *item = [NSMutableDictionary new]; // [macOS]

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:attributedText.string forKey:(id)kUTTypeUTF8PlainText];

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.items = @[ item ];
#else // [macOS
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setData:rtf forType:NSPasteboardTypeRTFD];
#endif // macOS]
}

@end
