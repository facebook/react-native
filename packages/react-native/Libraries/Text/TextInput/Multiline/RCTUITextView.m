/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextView.h>

#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTTextAttributes.h>

@implementation RCTUITextView {
#if !TARGET_OS_OSX // [macOS]
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
#endif // [macOS]
  RCTBackedTextViewDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
#if TARGET_OS_OSX // [macOS
  NSArray<NSPasteboardType> *_readablePasteboardTypes;
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
static UIFont *defaultPlaceholderFont()
{
  return [UIFont systemFontOfSize:17];
}
#else // [macOS
static NSFont *defaultPlaceholderFont()
{
  return [NSFont systemFontOfSize:[NSFont systemFontSize]];
}
#endif // macOS]

static RCTUIColor *defaultPlaceholderColor() // [macOS]
{
  return [RCTUIColor placeholderTextColor]; // [macOS]
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(textDidChange)
                                                 name:UITextViewTextDidChangeNotification
                                               object:self];
#if !TARGET_OS_OSX // [macOS]
    _placeholderView = [[UILabel alloc] initWithFrame:self.bounds];
    _placeholderView.isAccessibilityElement = NO;
    _placeholderView.numberOfLines = 0;
    [self addSubview:_placeholderView];
#else // [macOS
    // Fix blurry text on non-retina displays.
    self.canDrawSubviewsIntoLayer = YES;
    self.allowsUndo = YES;
#endif // macOS]

    _textInputDelegateAdapter = [[RCTBackedTextViewDelegateAdapter alloc] initWithTextView:self];

    self.backgroundColor = [RCTUIColor clearColor]; // [macOS]
    self.textColor = [RCTUIColor blackColor]; // [macOS]
    // This line actually removes 5pt (default value) left and right padding in UITextView.
#if !TARGET_OS_OSX // [macOS]
    self.textContainer.lineFragmentPadding = 0;
#else // [macOS
    // macOS has a bug where setting this to 0 will cause the scroll view to scroll to top when
    // inserting a newline at the bottom of a NSTextView when it has more rows than can be displayed
    // on screen.
    self.textContainer.lineFragmentPadding = 1;
#endif //macOS]
#if !TARGET_OS_OSX // [macOS]
    self.scrollsToTop = NO;
#endif // [macOS]
    self.scrollEnabled = YES;
  }

  return self;
}

- (void)setDelegate:(id<UITextViewDelegate>)delegate
{
  // Delegate is set inside `[RCTBackedTextViewDelegateAdapter initWithTextView]` and
  // it cannot be changed from outside.
  if (super.delegate) {
    return;
  }
  [super setDelegate:delegate];
}

#pragma mark - Accessibility

- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
{
  // UITextView is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented
  // inside the component.
}

- (NSString *)accessibilityLabel
{
  NSMutableString *accessibilityLabel = [NSMutableString new];

  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel.length > 0) {
    [accessibilityLabel appendString:superAccessibilityLabel];
  }

  if (self.placeholder.length > 0 && self.attributedText.string.length == 0) {
    if (accessibilityLabel.length > 0) {
      [accessibilityLabel appendString:@" "];
    }
    [accessibilityLabel appendString:self.placeholder];
  }

  return accessibilityLabel;
}

#pragma mark - Properties

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  [self _updatePlaceholder];
}

- (void)setPlaceholderColor:(RCTUIColor *)placeholderColor // [macOS]
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

#if TARGET_OS_OSX // [macOS
- (void)toggleAutomaticSpellingCorrection:(id)sender
{
  self.automaticSpellingCorrectionEnabled = !self.isAutomaticSpellingCorrectionEnabled;
  [_textInputDelegate automaticSpellingCorrectionDidChange:self.isAutomaticSpellingCorrectionEnabled];
}

- (void)toggleContinuousSpellChecking:(id)sender
{
  self.continuousSpellCheckingEnabled = !self.isContinuousSpellCheckingEnabled;
  [_textInputDelegate continuousSpellCheckingDidChange:self.isContinuousSpellCheckingEnabled];
}

- (void)toggleGrammarChecking:(id)sender
{
  self.grammarCheckingEnabled = !self.isGrammarCheckingEnabled;
  [_textInputDelegate grammarCheckingDidChange:self.isGrammarCheckingEnabled];
}

- (void)setSelectionColor:(RCTUIColor *)selectionColor
{
  NSMutableDictionary *selectTextAttributes = self.selectedTextAttributes.mutableCopy;
  selectTextAttributes[NSBackgroundColorAttributeName] = selectionColor ?: [NSColor selectedControlColor];
  self.selectedTextAttributes = selectTextAttributes.copy;
}

- (RCTUIColor*)selectionColor
{
  return (RCTUIColor*)self.selectedTextAttributes[NSBackgroundColorAttributeName];
}

- (void)setCursorColor:(NSColor *)cursorColor
{
  _cursorColor = cursorColor;
  self.insertionPointColor = cursorColor;
}

- (void)setEnabledTextCheckingTypes:(NSTextCheckingTypes)checkingType
{
  [super setEnabledTextCheckingTypes:checkingType];
  self.automaticDataDetectionEnabled = checkingType != 0;
}

- (NSTextAlignment)textAlignment
{
  return self.alignment;
}

- (NSString*)text
{
  return self.string;
}

- (void)setText:(NSString *)text
{
  self.string = text;
}

- (void)setReadablePasteBoardTypes:(NSArray<NSPasteboardType> *)readablePasteboardTypes
{
  _readablePasteboardTypes = readablePasteboardTypes;
}

- (void)setTypingAttributes:(__unused NSDictionary *)typingAttributes
{
  // Prevent NSTextView from changing its own typing attributes out from under us.
  [super setTypingAttributes:_defaultTextAttributes];
}

- (NSAttributedString*)attributedText
{
  return self.textStorage;
}

- (BOOL)becomeFirstResponder
{
  BOOL success = [super becomeFirstResponder];

  if (success) {
    id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
    if ([textInputDelegate respondsToSelector:@selector(textInputDidBeginEditing)]) {
      [textInputDelegate textInputDidBeginEditing];
    }
  }

  return success;
}

- (BOOL)resignFirstResponder
{
  if (self.selectable) {
    self.selectedRange = NSMakeRange(NSNotFound, 0);
  }

  BOOL success = [super resignFirstResponder];
  
  if (success) {
    // Break undo coalescing when losing focus.
    [self breakUndoCoalescing];
  }

  return success;
}
#endif // macOS]

- (void)setDefaultTextAttributes:(NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  if ([_defaultTextAttributes isEqualToDictionary:defaultTextAttributes]) {
    return;
  }

  _defaultTextAttributes = defaultTextAttributes;
  self.typingAttributes = defaultTextAttributes;
  [self _updatePlaceholder];
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)textDidChange
{
  _textWasPasted = NO;
  [self _invalidatePlaceholderVisibility];
}

#pragma mark - Overrides

- (void)setFont:(UIFont *)font
{
  [super setFont:font];
  [self _updatePlaceholder];
}

- (void)setTextAlignment:(NSTextAlignment)textAlignment
{
#if !TARGET_OS_OSX // [macOS]
  [super setTextAlignment:textAlignment];
  _placeholderView.textAlignment = textAlignment;
#else // [macOS
  self.alignment = textAlignment;
  [self setNeedsDisplay:YES];
#endif // macOS]
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
#if !TARGET_OS_OSX // [macOS]
  [super setAttributedText:attributedText];
#else // [macOS
  // Break undo coalescing when the text is changed by JS (e.g. autocomplete).
  [self breakUndoCoalescing];
  // Avoid Exception thrown while executing UI block: *** -[NSBigMutableString replaceCharactersInRange:withString:]: nil argument
  [self.textStorage setAttributedString:attributedText ?: [NSAttributedString new]];
#endif // macOS]
  [self textDidChange];
}

#pragma mark - Overrides

#if !TARGET_OS_OSX // [macOS]
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#else // [macOS
- (void)setSelectedTextRange:(NSRange)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#endif // macOS]
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

#if !TARGET_OS_OSX // [macOS]
  [super setSelectedTextRange:selectedTextRange];
#else // [macOS
  [super setSelectedRange:selectedTextRange];
#endif // macOS]
}

#if TARGET_OS_OSX // [macOS
- (NSRange)selectedTextRange
{
  return [super selectedRange];
}

- (NSDragOperation)draggingEntered:(id <NSDraggingInfo>)draggingInfo
{
  NSDragOperation dragOperation = [self.textInputDelegate textInputDraggingEntered:draggingInfo];
  NSDragOperation superOperation = [super draggingEntered:draggingInfo];
  // The delegate's operation should take precedence.
  return dragOperation != NSDragOperationNone ? dragOperation : superOperation;
}

- (void)draggingExited:(id<NSDraggingInfo>)draggingInfo
{
  [self.textInputDelegate textInputDraggingExited:draggingInfo];
  [super draggingExited:draggingInfo];
}

- (BOOL)performDragOperation:(id<NSDraggingInfo>)draggingInfo
{
  if ([self.textInputDelegate textInputShouldHandleDragOperation:draggingInfo]) {
    return [super performDragOperation:draggingInfo];
  }
  return YES;
}
- (NSArray *)readablePasteboardTypes
{
  return _readablePasteboardTypes ? _readablePasteboardTypes : [super readablePasteboardTypes];
}

// Remove the default touchbar that comes with NSTextView, since the actions that come with the
// default touchbar are currently not supported by RCTUITextView
- (NSTouchBar *)makeTouchBar
{
    return nil;
}

#endif // macOS]

- (void)paste:(id)sender
{
#if TARGET_OS_OSX // [macOS
  if ([self.textInputDelegate textInputShouldHandlePaste:self]) 
  {
#endif // macOS]
    _textWasPasted = YES;
    [super paste:sender];
#if TARGET_OS_OSX // [macOS
  }
#endif // macOS]
}

// Turn off scroll animation to fix flaky scrolling.
// This is only necessary for iOS <= 13.
// [macOS] we may not need to check for !TARGET_OS_OSX if __IPHONE_OS_VERSION_MAX_ALLOWED is defined,
// but it shouldn't hurt to do so for clarity's sake.
#if !TARGET_OS_OSX && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED < 140000
- (void)setContentOffset:(CGPoint)contentOffset animated:(__unused BOOL)animated
{
  [super setContentOffset:contentOffset animated:NO];
}
#endif

#if TARGET_OS_OSX // [macOS

#pragma mark - Placeholder

- (NSAttributedString*)placeholderTextAttributedString
{
  if (self.placeholder == nil) {
    return nil;
  }
  return [[NSAttributedString alloc] initWithString:self.placeholder attributes:[self _placeholderTextAttributes]];
}

- (void)drawRect:(NSRect)dirtyRect
{
  [super drawRect:dirtyRect];
  
  if (self.text.length == 0 && self.placeholder) {
    NSAttributedString *attributedPlaceholderString = self.placeholderTextAttributedString;
    
    if (attributedPlaceholderString) {
      NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedPlaceholderString];
      NSTextContainer *textContainer = [[NSTextContainer alloc] initWithContainerSize:self.textContainer.containerSize];
      NSLayoutManager *layoutManager = [NSLayoutManager new];
      
      textContainer.lineFragmentPadding = self.textContainer.lineFragmentPadding;
      [layoutManager addTextContainer:textContainer];
      [textStorage addLayoutManager:layoutManager];
      
      NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
      [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:self.textContainerOrigin];
    }
  }
}

#pragma mark - Text Insets

- (void)setTextContainerInsets:(UIEdgeInsets)textContainerInsets
{
  // NSTextView             has a NSSize       textContainerInset  property
  // UITextview             has a UIEdgeInsets textContainerInset  property
  // RCTUITextView mac only has a UIEdgeInsets textContainerInsets property
  // UI/NSTextField do NOT have textContainerInset properties
  _textContainerInsets = textContainerInsets;
  super.textContainerInset = NSMakeSize(MIN(textContainerInsets.left, textContainerInsets.right), MIN(textContainerInsets.top, textContainerInsets.bottom));

  if (self.shouldDrawInsertionPoint) {
    [self updateInsertionPointStateAndRestartTimer:NO];
  }
}

#endif // macOS]

- (void)selectAll:(id)sender
{
  [super selectAll:sender];

#if !TARGET_OS_OSX // [macOS]
  // `selectAll:` does not work for UITextView when it's being called inside UITextView's delegate methods.
  dispatch_async(dispatch_get_main_queue(), ^{
    UITextRange *selectionRange = [self textRangeFromPosition:self.beginningOfDocument toPosition:self.endOfDocument];
    [self setSelectedTextRange:selectionRange notifyDelegate:NO];
  });
#endif // [macOS]
}

#pragma mark - Layout

- (CGFloat)preferredMaxLayoutWidth
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return _preferredMaxLayoutWidth ?: self.placeholderSize.width;
}

- (CGSize)placeholderSize
{
#if !TARGET_OS_OSX // [macOS]
  UIEdgeInsets textContainerInset = self.textContainerInset;
#else // [macOS
  UIEdgeInsets textContainerInset = self.textContainerInsets;
#endif // macOS]
  NSString *placeholder = self.placeholder ?: @"";
#if !TARGET_OS_OSX // [macOS]
  CGSize maxPlaceholderSize =
      CGSizeMake(UIEdgeInsetsInsetRect(self.bounds, textContainerInset).size.width, CGFLOAT_MAX);
  CGSize placeholderSize = [placeholder boundingRectWithSize:maxPlaceholderSize
                                                     options:NSStringDrawingUsesLineFragmentOrigin
                                                  attributes:[self _placeholderTextAttributes]
                                                     context:nil]
                               .size;
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
#else // [macOS
  CGFloat scale = _pointScaleFactor ?: self.window.backingScaleFactor;
  CGSize placeholderSize = [placeholder sizeWithAttributes:[self _placeholderTextAttributes]];
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width, scale), RCTCeilPixelValue(placeholderSize.height, scale));
#endif // macOS]
  placeholderSize.width += textContainerInset.left + textContainerInset.right;
  placeholderSize.height += textContainerInset.top + textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`; as `sizeThatFits:` does).
  return placeholderSize;
}

- (CGSize)contentSize
{
#if !TARGET_OS_OSX // [macOS]
  CGSize contentSize = super.contentSize;
  CGSize placeholderSize = _placeholderView.isHidden ? CGSizeZero : self.placeholderSize;
#else // [macOS
  CGSize contentSize = super.intrinsicContentSize;
  CGSize placeholderSize = self.placeholderSize;
#endif // macOS]
  // When a text input is empty, it actually displays a placeholder.
  // So, we have to consider `placeholderSize` as a minimum `contentSize`.
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(contentSize.width, placeholderSize.width), MAX(contentSize.height, placeholderSize.height));
}

#if !TARGET_OS_OSX // [macOS]
- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}
#endif // [macOS]

- (CGSize)intrinsicContentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return [self sizeThatFits:CGSizeMake(self.preferredMaxLayoutWidth, CGFLOAT_MAX)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
#if !TARGET_OS_OSX // [macOS]
  CGSize textSize = [super sizeThatFits:size];
#else // [macOS
  [self.layoutManager glyphRangeForTextContainer:self.textContainer];
  NSRect rect = [self.layoutManager usedRectForTextContainer:self.textContainer];
  CGSize textSize = CGSizeMake(MIN(rect.size.width, size.width), rect.size.height);
#endif // macOS]
  CGSize placeholderSize = self.placeholderSize;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(textSize.width, placeholderSize.width), MAX(textSize.height, placeholderSize.height));
}

#pragma mark - Context Menu

#if !TARGET_OS_OSX // [macOS]
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}
#endif // [macOS]

#pragma mark - Placeholder

- (void)_invalidatePlaceholderVisibility
{
#if !TARGET_OS_OSX // [macOS]
  BOOL isVisible = _placeholder.length != 0 && self.attributedText.length == 0;
  _placeholderView.hidden = !isVisible;
#else // [macOS
  [self setNeedsDisplay:YES];
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
- (void)deleteBackward {
  id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
  if ([textInputDelegate textInputShouldHandleDeleteBackward:self]) {
    [super deleteBackward];
  }
}
#else // [macOS
- (BOOL)performKeyEquivalent:(NSEvent *)event {
  if (!self.hasMarkedText && ![self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    return YES;
  }

  return [super performKeyEquivalent:event];
}

- (void)keyDown:(NSEvent *)event {
  // If has marked text, handle by native and return
  // Do this check before textInputShouldHandleKeyEvent as that one attempts to send the event to JS
  if (self.hasMarkedText) {
    [super keyDown:event];
    return;
  }

  // textInputShouldHandleKeyEvent represents if native should handle the event instead of JS.
  // textInputShouldHandleKeyEvent also sends keyDown event to JS internally, so we only call this once  
  if ([self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    [super keyDown:event];
    [self.textInputDelegate submitOnKeyDownIfNeeded:event];
  }
}

- (void)keyUp:(NSEvent *)event {
  if ([self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    [super keyUp:event];
  }
}
#endif // macOS]

- (void)_updatePlaceholder
{
#if !TARGET_OS_OSX // [macOS]
  _placeholderView.attributedText = [[NSAttributedString alloc] initWithString:_placeholder ?: @""
                                                                    attributes:[self _placeholderTextAttributes]];
#else // [macOS
  [self setNeedsDisplay:YES];
#endif // macOS]
  [self _invalidatePlaceholderVisibility];
}

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  [textAttributes setValue:self.placeholderColor ?: defaultPlaceholderColor() forKey:NSForegroundColorAttributeName];

  if (![textAttributes objectForKey:NSFontAttributeName]) {
    [textAttributes setValue:defaultPlaceholderFont() forKey:NSFontAttributeName];
  }

  return textAttributes;
}

#pragma mark - Caret Manipulation
#if !TARGET_OS_OSX // [macOS]

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}
#endif // [macOS]

#pragma mark - Utility Methods

@end
