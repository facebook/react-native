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

@implementation RCTUITextView
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
#endif // TODO(macOS GH#774)
  RCTBackedTextViewDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
}

static UIFont *defaultPlaceholderFont()
{
  return [UIFont systemFontOfSize:17];
}

static RCTUIColor *defaultPlaceholderColor() // TODO(OSS Candidate ISS#2710739)
{
  return [RCTUIColor placeholderTextColor]; // TODO(OSS Candidate ISS#2710739)
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(textDidChange)
                                                 name:UITextViewTextDidChangeNotification
                                               object:self];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    _placeholderView = [[UILabel alloc] initWithFrame:self.bounds];
    _placeholderView.isAccessibilityElement = NO;
    _placeholderView.numberOfLines = 0;
    [self addSubview:_placeholderView];
#else // [TODO(macOS GH#774)
    NSTextCheckingTypes checkingTypes = 0;
    self.enabledTextCheckingTypes = checkingTypes;
    self.insertionPointColor = [NSColor selectedControlColor];
    // Fix blurry text on non-retina displays.
    self.canDrawSubviewsIntoLayer = YES;
#endif // ]TODO(macOS GH#774)

    _textInputDelegateAdapter = [[RCTBackedTextViewDelegateAdapter alloc] initWithTextView:self];

    self.backgroundColor = [RCTUIColor clearColor]; // TODO(macOS GH#774)
    self.textColor = [RCTUIColor blackColor]; // TODO(macOS GH#774)
    // This line actually removes 5pt (default value) left and right padding in UITextView.
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    self.textContainer.lineFragmentPadding = 0;
#else
    // macOS has a bug where setting this to 0 will cause the scroll view to scroll to top when
    // inserting a newline at the bottom of a NSTextView when it has more rows than can be displayed
    // on screen.
    self.textContainer.lineFragmentPadding = 1;
#endif
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    self.scrollsToTop = NO;
#endif // TODO(macOS GH#774)
    self.scrollEnabled = YES;
  }

  return self;
}

- (void)setDelegate:(id<UITextViewDelegate>)delegate {
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
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented inside the component.
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

- (void)setPlaceholderColor:(RCTUIColor *)placeholderColor // TODO(OSS Candidate ISS#2710739)
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)setSelectionColor:(RCTUIColor *)selectionColor
{
  NSMutableDictionary *selectTextAttributes = self.selectedTextAttributes.mutableCopy;
  selectTextAttributes[NSBackgroundColorAttributeName] = selectionColor ?: [NSColor selectedControlColor];
  self.selectedTextAttributes = selectTextAttributes.copy;
  self.insertionPointColor = self.selectionColor ?: [NSColor selectedControlColor];
}

- (RCTUIColor*)selectionColor
{
  return (RCTUIColor*)self.selectedTextAttributes[NSBackgroundColorAttributeName];
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
  BOOL success =  [[self window] makeFirstResponder:self];

  if (success) {
    id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
    if ([textInputDelegate respondsToSelector:@selector(textInputDidBeginEditing)]) {
      [textInputDelegate textInputDidBeginEditing];
    }
  }

  return success;
}
#endif // ]TODO(macOS GH#774)

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
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [super setTextAlignment:textAlignment];
  _placeholderView.textAlignment = textAlignment;
#else // [TODO(macOS GH#774)
  self.alignment = textAlignment;
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS GH#774)
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  // Using `setAttributedString:` while user is typing breaks some internal mechanics
  // when entering complex input languages such as Chinese, Korean or Japanese.
  // see: https://github.com/facebook/react-native/issues/19339

  // We try to avoid calling this method as much as we can.
  // If the text has changed, there is nothing we can do.
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (![super.attributedText.string isEqualToString:attributedText.string]) {
    [super setAttributedText:attributedText];
  } else {
  // But if the text is preserved, we just copying the attributes from the source string.
    if (![super.attributedText isEqualToAttributedString:attributedText]) {
      [self copyTextAttributesFrom:attributedText];
    }
  }
#else // [TODO(macOS GH#774)
  if (![self.textStorage isEqualTo:attributedText.string]) {
    if (attributedText != nil) {
      [self.textStorage setAttributedString:attributedText];
    } else {
      // Avoid Exception thrown while executing UI block: *** -[NSBigMutableString replaceCharactersInRange:withString:]: nil argument
      [self.textStorage setAttributedString:[NSAttributedString new]];
    }
  } else {
    // But if the text is preserved, we just copy the attributes from the source string.
    if (![self.textStorage isEqualToAttributedString:attributedText]) {
      [self copyTextAttributesFrom:attributedText];
    }
  }
#endif // ]TODO(macOS GH#774)
  [self textDidChange];
}

#pragma mark - Overrides

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#else // [TODO(macOS GH#774)
- (void)setSelectedTextRange:(NSRange)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#endif // ]TODO(macOS GH#774)
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [super setSelectedTextRange:selectedTextRange];
#else // [TODO(macOS GH#774)
  [super setSelectedRange:selectedTextRange];
#endif // ]TODO(macOS GH#774)
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (NSRange)selectedTextRange
{
  return [super selectedRange];
}
#endif // ]TODO(macOS GH#774)

- (void)paste:(id)sender
{
  [super paste:sender];
  _textWasPasted = YES;
}

// Turn off scroll animation to fix flaky scrolling.
// This is only necessary for iOS <= 13.
// TODO(macOS GH#774) - we may not need to check for !TARGET_OS_OSX if __IPHONE_OS_VERSION_MAX_ALLOWED is defined,
// but it shouldn't hurt to do so for clarity's sake.
#if !TARGET_OS_OSX && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED < 140000
- (void)setContentOffset:(CGPoint)contentOffset animated:(__unused BOOL)animated
{
  [super setContentOffset:contentOffset animated:NO];
}
#endif

#if TARGET_OS_OSX // [TODO(macOS GH#774)

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
}

#endif // ]TODO(macOS GH#774)

- (void)selectAll:(id)sender
{
  [super selectAll:sender];

#if !TARGET_OS_OSX // TODO(macOS GH#774) For `selectTextOnFocus` prop, which isn't supported on macOS atm.
  // `selectAll:` does not work for UITextView when it's being called inside UITextView's delegate methods.
  dispatch_async(dispatch_get_main_queue(), ^{
    UITextRange *selectionRange = [self textRangeFromPosition:self.beginningOfDocument toPosition:self.endOfDocument];
    [self setSelectedTextRange:selectionRange notifyDelegate:NO];
  });
#endif
}

#pragma mark - Layout

- (CGFloat)preferredMaxLayoutWidth
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return _preferredMaxLayoutWidth ?: self.placeholderSize.width;
}

- (CGSize)placeholderSize
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIEdgeInsets textContainerInset = self.textContainerInset;
#else // [TODO(macOS GH#774)
  UIEdgeInsets textContainerInset = self.textContainerInsets;
#endif // ]TODO(macOS GH#774)
  NSString *placeholder = self.placeholder ?: @"";
  
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGSize maxPlaceholderSize = CGSizeMake(UIEdgeInsetsInsetRect(self.bounds, textContainerInset).size.width, CGFLOAT_MAX);
  CGSize placeholderSize = [placeholder boundingRectWithSize:maxPlaceholderSize options:NSStringDrawingUsesLineFragmentOrigin attributes:[self _placeholderTextAttributes] context:nil].size;
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
#else // [TODO(macOS GH#774)
  CGFloat scale = self.window.backingScaleFactor;
  CGSize placeholderSize = [placeholder sizeWithAttributes:[self _placeholderTextAttributes]];
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width, scale), RCTCeilPixelValue(placeholderSize.height, scale));
#endif // ]TODO(macOS GH#774)
  placeholderSize.width += textContainerInset.left + textContainerInset.right;
  placeholderSize.height += textContainerInset.top + textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`; as `sizeThatFits:` does).
  return placeholderSize;
}

- (CGSize)contentSize
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGSize contentSize = super.contentSize;
  CGSize placeholderSize = _placeholderView.isHidden ? CGSizeZero : self.placeholderSize;
#else // [TODO(macOS GH#774)
  CGSize contentSize = super.intrinsicContentSize;
  CGSize placeholderSize = self.placeholderSize;
#endif // ]TODO(macOS GH#774)
  // When a text input is empty, it actually displays a placehoder.
  // So, we have to consider `placeholderSize` as a minimum `contentSize`.
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(
    MAX(contentSize.width, placeholderSize.width),
    MAX(contentSize.height, placeholderSize.height));
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}
#endif // TODO(macOS GH#774)

- (CGSize)intrinsicContentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return [self sizeThatFits:CGSizeMake(self.preferredMaxLayoutWidth, CGFLOAT_MAX)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGSize textSize = [super sizeThatFits:size];
#else
  [self.layoutManager glyphRangeForTextContainer:self.textContainer];
  NSRect rect = [self.layoutManager usedRectForTextContainer:self.textContainer];
  CGSize textSize = CGSizeMake(MIN(rect.size.width, size.width), rect.size.height);
#endif // TODO(macOS GH#774)
  CGSize placeholderSize = self.placeholderSize;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(textSize.width, placeholderSize.width), MAX(textSize.height, placeholderSize.height));
}

#pragma mark - Context Menu

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}
#endif // TODO(macOS GH#774)

#pragma mark - Placeholder

- (void)_invalidatePlaceholderVisibility
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  BOOL isVisible = _placeholder.length != 0 && self.attributedText.length == 0;
  _placeholderView.hidden = !isVisible;
#else // [TODO(macOS GH#774)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS GH#774)
}

#if !TARGET_OS_OSX // [TODO(OSS Candidate ISS#2710739)
- (void)deleteBackward {
  id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
  if ([textInputDelegate textInputShouldHandleDeleteBackward:self]) {
    [super deleteBackward];
  }
}
#endif // ]TODO(OSS Candidate ISS#2710739)

- (void)_updatePlaceholder
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  _placeholderView.attributedText = [[NSAttributedString alloc] initWithString:_placeholder ?: @"" attributes:[self _placeholderTextAttributes]];
#else // [TODO(macOS GH#774)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS GH#774)
  [self _invalidatePlaceholderVisibility];
}

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes = [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  [textAttributes setValue:self.placeholderColor ?: defaultPlaceholderColor() forKey:NSForegroundColorAttributeName];

  if (![textAttributes objectForKey:NSFontAttributeName]) {
    [textAttributes setValue:defaultPlaceholderFont() forKey:NSFontAttributeName];
  }

  return textAttributes;
}

#pragma mark - Caret Manipulation
#if !TARGET_OS_OSX // TODO(macOS GH#774)

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}
#endif

#pragma mark - Utility Methods

- (void)copyTextAttributesFrom:(NSAttributedString *)sourceString
{
  [self.textStorage beginEditing];

  NSTextStorage *textStorage = self.textStorage;
  [sourceString enumerateAttributesInRange:NSMakeRange(0, sourceString.length)
                                   options:NSAttributedStringEnumerationReverse
                                usingBlock:^(NSDictionary<NSAttributedStringKey,id> * _Nonnull attrs, NSRange range, BOOL * _Nonnull stop) {
                                  [textStorage setAttributes:attrs range:range];
                                }];

  [self.textStorage endEditing];
}

@end
