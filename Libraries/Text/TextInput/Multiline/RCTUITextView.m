/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
#endif // TODO(macOS ISS#2323203)
  RCTBackedTextViewDelegateAdapter *_textInputDelegateAdapter;
}

@synthesize reactTextAttributes = _reactTextAttributes;

static UIFont *defaultPlaceholderFont()
{
  return [UIFont systemFontOfSize:17];
}

static RCTUIColor *defaultPlaceholderColor() // TODO(OSS Candidate ISS#2710739)
{
  // Default placeholder color from UITextField.
  return [RCTUIColor colorWithRed:0 green:0 blue:0.0980392 alpha:0.22]; // TODO(OSS Candidate ISS#2710739)
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(textDidChange)
                                                 name:UITextViewTextDidChangeNotification
                                               object:self];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    _placeholderView = [[UILabel alloc] initWithFrame:self.bounds];
    _placeholderView.isAccessibilityElement = NO;
    _placeholderView.numberOfLines = 0;
    _placeholderView.textColor = defaultPlaceholderColor();
    [self addSubview:_placeholderView];
#else // [TODO(macOS ISS#2323203)
    NSTextCheckingTypes checkingTypes = 0;
    self.enabledTextCheckingTypes = checkingTypes;
    self.insertionPointColor = [NSColor selectedControlColor];
#endif // ]TODO(macOS ISS#2323203)

    _textInputDelegateAdapter = [[RCTBackedTextViewDelegateAdapter alloc] initWithTextView:self];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  _placeholderView.text = _placeholder;
  _placeholderView.attributedText = [[NSAttributedString alloc] initWithString:_placeholder ?: @"" attributes:[self placeholderEffectiveTextAttributes]];
#else // [TODO(macOS ISS#2323203)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS ISS#2323203)
}

- (void)setPlaceholderColor:(RCTUIColor *)placeholderColor // TODO(OSS Candidate ISS#2710739)
{
  _placeholderColor = placeholderColor;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  _placeholderView.textColor = _placeholderColor ?: defaultPlaceholderColor();
#else // [TODO(macOS ISS#2323203)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS ISS#2323203)
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
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
#endif // ]TODO(macOS ISS#2323203)

- (void)setReactTextAttributes:(RCTTextAttributes *)reactTextAttributes
{
  if ([reactTextAttributes isEqual:_reactTextAttributes]) {
    return;
  }
  self.typingAttributes = reactTextAttributes.effectiveTextAttributes;
  _reactTextAttributes = reactTextAttributes;
  // Update placeholder text attributes
  [self setPlaceholder:_placeholder];
}

- (RCTTextAttributes *)reactTextAttributes
{
  return _reactTextAttributes;
}

- (void)textDidChange
{
  _textWasPasted = NO;
  [self invalidatePlaceholderVisibility];
}

#pragma mark - Overrides

- (void)setFont:(UIFont *)font
{
  [super setFont:font];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  _placeholderView.font = font ?: defaultPlaceholderFont();
#else // [TODO(macOS ISS#2323203)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS ISS#2323203)
}

- (void)setTextAlignment:(NSTextAlignment)textAlignment
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [super setTextAlignment:textAlignment];
  _placeholderView.textAlignment = textAlignment;
#else // [TODO(macOS ISS#2323203)
  self.alignment = textAlignment;
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS ISS#2323203)
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  // Using `setAttributedString:` while user is typing breaks some internal mechanics
  // when entering complex input languages such as Chinese, Korean or Japanese.
  // see: https://github.com/facebook/react-native/issues/19339

  // We try to avoid calling this method as much as we can.
  // If the text has changed, there is nothing we can do.
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (![super.attributedText.string isEqualToString:attributedText.string]) {
    [super setAttributedText:attributedText];
  } else {
  // But if the text is preserved, we just copying the attributes from the source string.
    if (![super.attributedText isEqualToAttributedString:attributedText]) {
      [self copyTextAttributesFrom:attributedText];
    }
  }
#else // [TODO(macOS ISS#2323203)
  if (![self.textStorage isEqualTo:attributedText.string]) {
    if (attributedText != nil) {
      [self.textStorage setAttributedString:attributedText];
    } else {
      // Avoid Exception thrown while executing UI block: *** -[NSBigMutableString replaceCharactersInRange:withString:]: nil argument
      [self.textStorage setAttributedString:[NSAttributedString new]];
    }
  } else {
  // But if the text is preserved, we just copying the attributes from the source string.
    if (![self.textStorage isEqualToAttributedString:attributedText]) {
      [self copyTextAttributesFrom:attributedText];
    }
  }
#endif // ]TODO(macOS ISS#2323203)
  [self textDidChange];
}

#pragma mark - Overrides

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#else // [TODO(macOS ISS#2323203)
- (void)setSelectedTextRange:(NSRange)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
#endif // ]TODO(macOS ISS#2323203)
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [super setSelectedTextRange:selectedTextRange];
#else // [TODO(macOS ISS#2323203)
  [super setSelectedRange:selectedTextRange];
#endif // ]TODO(macOS ISS#2323203)
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (NSRange)selectedTextRange
{
  return [super selectedRange];
}
#endif // ]TODO(macOS ISS#2323203)

- (void)paste:(id)sender
{
  [super paste:sender];
  _textWasPasted = YES;
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)setContentOffset:(CGPoint)contentOffset animated:(__unused BOOL)animated
{
  // Turning off scroll animation.
  // This fixes the problem also known as "flaky scrolling".
  [super setContentOffset:contentOffset animated:NO];
}
#endif // [TODO(macOS ISS#2323203)

#if TARGET_OS_OSX

#pragma mark - Placeholder

- (NSAttributedString*)placeholderTextAttributedString
{
  if (self.placeholder == nil) {
    return nil;
  }
  NSMutableDictionary *placeholderAttributes = [self.typingAttributes mutableCopy];
  if (placeholderAttributes == nil) {
    placeholderAttributes = [NSMutableDictionary dictionary];
  }
  placeholderAttributes[NSForegroundColorAttributeName] = self.placeholderColor ?: defaultPlaceholderColor();
  placeholderAttributes[NSFontAttributeName] = self.font ?: defaultPlaceholderFont();
  return [[NSAttributedString alloc] initWithString:self.placeholder attributes:placeholderAttributes];
}

- (void)drawRect:(NSRect)dirtyRect
{
  [super drawRect:dirtyRect];
  
  if (self.text.length == 0 && self.placeholder) {
    NSAttributedString *attributedPlaceholderString = self.placeholderTextAttributedString;
    
    if (attributedPlaceholderString) {
      NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedPlaceholderString];
      NSTextContainer *textContainer = [[NSTextContainer alloc] initWithContainerSize:self.textContainer.containerSize];
      NSLayoutManager *layoutManager = [[NSLayoutManager alloc] init];
      
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

#endif // ]TODO(macOS ISS#2323203)

#pragma mark - Layout

- (CGFloat)preferredMaxLayoutWidth
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return _preferredMaxLayoutWidth ?: self.placeholderSize.width;
}

- (CGSize)placeholderSize
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIEdgeInsets textContainerInset = self.textContainerInset;
#else // [TODO(macOS ISS#2323203)
  UIEdgeInsets textContainerInset = self.textContainerInsets;
#endif // ]TODO(macOS ISS#2323203)
  NSString *placeholder = self.placeholder ?: @"";
  
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  CGSize maxPlaceholderSize = CGSizeMake(UIEdgeInsetsInsetRect(self.bounds, textContainerInset).size.width, CGFLOAT_MAX);
  CGSize placeholderSize = [placeholder boundingRectWithSize:maxPlaceholderSize options:NSStringDrawingUsesLineFragmentOrigin attributes:[self placeholderEffectiveTextAttributes] context:nil].size;
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
#else // [TODO(macOS ISS#2323203)
  CGFloat scale = self.window.backingScaleFactor;
  CGSize placeholderSize = [placeholder sizeWithAttributes:@{NSFontAttributeName: self.font ?: defaultPlaceholderFont()}];
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width, scale), RCTCeilPixelValue(placeholderSize.height, scale));
#endif // ]TODO(macOS ISS#2323203)
  placeholderSize.width += textContainerInset.left + textContainerInset.right;
  placeholderSize.height += textContainerInset.top + textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`; as `sizeThatFits:` does).
  return placeholderSize;
}

- (CGSize)contentSize
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  CGSize contentSize = super.contentSize;
  CGSize placeholderSize = _placeholderView.isHidden ? CGSizeZero : self.placeholderSize;
#else // [TODO(macOS ISS#2323203)
  CGSize contentSize = super.intrinsicContentSize;
  CGSize placeholderSize = self.placeholderSize;
#endif // ]TODO(macOS ISS#2323203)
  // When a text input is empty, it actually displays a placehoder.
  // So, we have to consider `placeholderSize` as a minimum `contentSize`.
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(
    MAX(contentSize.width, placeholderSize.width),
    MAX(contentSize.height, placeholderSize.height));
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}
#endif // TODO(macOS ISS#2323203)

- (CGSize)intrinsicContentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return [self sizeThatFits:CGSizeMake(self.preferredMaxLayoutWidth, CGFLOAT_MAX)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  CGSize textSize = [super sizeThatFits:size];
#else
  [self.layoutManager glyphRangeForTextContainer:self.textContainer];
  NSRect rect = [self.layoutManager usedRectForTextContainer:self.textContainer];
  CGSize textSize = CGSizeMake(MIN(rect.size.width, size.width), rect.size.height);
#endif // TODO(macOS ISS#2323203)
  CGSize placeholderSize = self.placeholderSize;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(textSize.width, placeholderSize.width), MAX(textSize.height, placeholderSize.height));
}

#pragma mark - Context Menu

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}
#endif // TODO(macOS ISS#2323203)

#pragma mark - Placeholder

- (void)invalidatePlaceholderVisibility
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  BOOL isVisible = _placeholder.length != 0 && self.attributedText.length == 0;
  _placeholderView.hidden = !isVisible;
#else // [TODO(macOS ISS#2323203)
  [self setNeedsDisplay:YES];
#endif // ]TODO(macOS ISS#2323203)
}

#if !TARGET_OS_OSX // [TODO(OSS Candidate ISS#2710739)
- (void)deleteBackward {
  id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
  if ([textInputDelegate textInputShouldHandleDeleteBackward:self]) {
    [super deleteBackward];
  }
}
#endif // ]TODO(OSS Candidate ISS#2710739)

- (NSDictionary<NSAttributedStringKey, id> *)placeholderEffectiveTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *effectiveTextAttributes = [NSMutableDictionary dictionaryWithDictionary:@{
                                                                                                                            NSFontAttributeName: _reactTextAttributes.effectiveFont ?: defaultPlaceholderFont(),
                                                                                                                            NSForegroundColorAttributeName: self.placeholderColor ?: defaultPlaceholderColor(),
                                                                                                                            NSKernAttributeName:isnan(_reactTextAttributes.letterSpacing) ? @0 : @(_reactTextAttributes.letterSpacing)
                                                                                                                            }];
  NSParagraphStyle *paragraphStyle = [_reactTextAttributes effectiveParagraphStyle];
  if (paragraphStyle) {
    effectiveTextAttributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }
  
  return [effectiveTextAttributes copy];
}

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
