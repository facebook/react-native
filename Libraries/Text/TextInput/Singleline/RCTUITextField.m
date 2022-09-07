/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>

#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTBackedTextInputDelegate.h> // TODO(OSS Candidate ISS#2710739)
#import <React/RCTTextAttributes.h>


#if TARGET_OS_OSX // [TODO(macOS GH#774)

#if RCT_SUBCLASS_SECURETEXTFIELD
#define RCTUITextFieldCell RCTUISecureTextFieldCell
@interface RCTUISecureTextFieldCell : NSSecureTextFieldCell
#else
@interface RCTUITextFieldCell : NSTextFieldCell
#endif

@property (nonatomic, assign) UIEdgeInsets textContainerInset;
@property (nonatomic, getter=isAutomaticTextReplacementEnabled) BOOL automaticTextReplacementEnabled;
@property (nonatomic, getter=isAutomaticSpellingCorrectionEnabled) BOOL automaticSpellingCorrectionEnabled;
@property (nonatomic, getter=isContinuousSpellCheckingEnabled) BOOL continuousSpellCheckingEnabled;
@property (nonatomic, getter=isGrammarCheckingEnabled) BOOL grammarCheckingEnabled;
@property (nonatomic, strong, nullable) RCTUIColor *selectionColor;

@end

@implementation RCTUITextFieldCell

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  _textContainerInset = textContainerInset;
}

- (NSRect)titleRectForBounds:(NSRect)rect
{
  return UIEdgeInsetsInsetRect([super titleRectForBounds:rect], self.textContainerInset);
}

- (void)editWithFrame:(NSRect)rect inView:(NSView *)controlView editor:(NSText *)textObj delegate:(id)delegate event:(NSEvent *)event
{
  [super editWithFrame:[self titleRectForBounds:rect] inView:controlView editor:textObj delegate:delegate event:event];
}

- (void)selectWithFrame:(NSRect)rect inView:(NSView *)controlView editor:(NSText *)textObj delegate:(id)delegate start:(NSInteger)selStart length:(NSInteger)selLength
{
  [super selectWithFrame:[self titleRectForBounds:rect] inView:controlView editor:textObj delegate:delegate start:selStart length:selLength];
}

- (void)drawInteriorWithFrame:(NSRect)cellFrame inView:(NSView *)controlView
{
  if (self.drawsBackground) {
    if (self.backgroundColor && self.backgroundColor.alphaComponent > 0) {
      
      [self.backgroundColor set];
      NSRectFill(cellFrame);
    }
  }
  
  [super drawInteriorWithFrame:[self titleRectForBounds:cellFrame] inView:controlView];
}

- (NSText *)setUpFieldEditorAttributes:(NSText *)textObj
{
  NSTextView *fieldEditor = (NSTextView *)[super setUpFieldEditorAttributes:textObj];
  fieldEditor.automaticSpellingCorrectionEnabled = self.isAutomaticSpellingCorrectionEnabled;
  fieldEditor.automaticTextReplacementEnabled = self.isAutomaticTextReplacementEnabled;
  fieldEditor.continuousSpellCheckingEnabled = self.isContinuousSpellCheckingEnabled;
  fieldEditor.grammarCheckingEnabled = self.isGrammarCheckingEnabled;
  NSMutableDictionary *selectTextAttributes = fieldEditor.selectedTextAttributes.mutableCopy;
  selectTextAttributes[NSBackgroundColorAttributeName] = self.selectionColor ?: [NSColor selectedControlColor];
	fieldEditor.selectedTextAttributes = selectTextAttributes;
  return fieldEditor;
}

@end
#endif // ]TODO(macOS GH#774)

#ifdef RCT_SUBCLASS_SECURETEXTFIELD
@implementation RCTUISecureTextField {
#else
@implementation RCTUITextField {
#endif
  RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@dynamic delegate;
#endif // ]TODO(macOS GH#774)

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
        
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

#if TARGET_OS_OSX // [TODO(macOS GH#774)
    [self setBordered:NO];
    [self setAllowsEditingTextAttributes:YES];
    [self setBackgroundColor:[NSColor clearColor]];
#endif // ]TODO(macOS GH#774)

    _textInputDelegateAdapter = [[RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
    _scrollEnabled = YES;
  }

  return self;
}

- (void)_textDidChange
{
  _textWasPasted = NO;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  [self setAttributedText:[[NSAttributedString alloc] initWithString:[self text]
                                                          attributes:[self defaultTextAttributes]]];
#endif // ]TODO(macOS GH#774)
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (BOOL)hasMarkedText
{
  return ((NSTextView *)self.currentEditor).hasMarkedText;
}
#endif // ]TODO(macOS GH#774)
  
#pragma mark - Accessibility

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
#else
- (void)setAccessibilityElement:(BOOL)isAccessibilityElement
#endif // ]TODO(macOS GH#774)
{
  // UITextField is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented inside the component.
}

#pragma mark - Properties

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  _textContainerInset = textContainerInset;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [self setNeedsLayout];
#else // [TODO(macOS GH#774)
  ((RCTUITextFieldCell*)self.cell).textContainerInset = _textContainerInset;
#endif // ]TODO(macOS GH#774)
}

#if TARGET_OS_OSX // TODO(macOS GH#774)

+ (Class)cellClass
{
  return RCTUITextFieldCell.class;
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  self.attributedStringValue = attributedText;
}

- (NSAttributedString *)attributedText
{
  return self.attributedStringValue;
}

- (void)setText:(NSString *)text
{
  self.stringValue = text;
}

- (NSString*)text
{
  return self.stringValue;
}

- (void)setAutomaticTextReplacementEnabled:(BOOL)automaticTextReplacementEnabled
{
  ((RCTUITextFieldCell*)self.cell).automaticTextReplacementEnabled = automaticTextReplacementEnabled;
}

- (BOOL)isAutomaticTextReplacementEnabled
{
  return ((RCTUITextFieldCell*)self.cell).isAutomaticTextReplacementEnabled;
}

- (void)setAutomaticSpellingCorrectionEnabled:(BOOL)automaticSpellingCorrectionEnabled
{
  ((RCTUITextFieldCell*)self.cell).automaticSpellingCorrectionEnabled = automaticSpellingCorrectionEnabled;
}

- (BOOL)isAutomaticSpellingCorrectionEnabled
{
  return ((RCTUITextFieldCell*)self.cell).isAutomaticSpellingCorrectionEnabled;
}

- (void)setContinuousSpellCheckingEnabled:(BOOL)continuousSpellCheckingEnabled
{
  ((RCTUITextFieldCell*)self.cell).continuousSpellCheckingEnabled = continuousSpellCheckingEnabled;
}

- (BOOL)isContinuousSpellCheckingEnabled
{
  return ((RCTUITextFieldCell*)self.cell).isContinuousSpellCheckingEnabled;
}

- (void)setGrammarCheckingEnabled:(BOOL)grammarCheckingEnabled
{
  ((RCTUITextFieldCell*)self.cell).grammarCheckingEnabled = grammarCheckingEnabled;
}

- (BOOL)isGrammarCheckingEnabled
{
  return ((RCTUITextFieldCell*)self.cell).isGrammarCheckingEnabled;
}

- (void)setSelectionColor:(RCTUIColor *)selectionColor // TODO(OSS Candidate ISS#2710739)
{
  ((RCTUITextFieldCell*)self.cell).selectionColor = selectionColor;
}

- (RCTUIColor*)selectionColor // TODO(OSS Candidate ISS#2710739)
{
  return ((RCTUITextFieldCell*)self.cell).selectionColor;
}

- (void)setFont:(UIFont *)font
{
  ((RCTUITextFieldCell*)self.cell).font = font;
}

- (UIFont *)font
{
  return ((RCTUITextFieldCell*)self.cell).font;
}

- (void)setEnableFocusRing:(BOOL)enableFocusRing {
  if (_enableFocusRing != enableFocusRing) {
    _enableFocusRing = enableFocusRing;
  }

  if (enableFocusRing) {
    [self setFocusRingType:NSFocusRingTypeDefault];
  } else {
    [self setFocusRingType:NSFocusRingTypeNone];
  }
}

#endif // ]TODO(macOS GH#774)

- (void)setPlaceholder:(NSString *)placeholder
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [super setPlaceholder:placeholder];
#else // [TODO(macOS GH#774)
  [super setPlaceholderString:placeholder];
#endif // ]TODO(macOS GH#774)
  [self _updatePlaceholder];
}

- (NSString*)placeholder // [TODO(macOS GH#774)
{
#if !TARGET_OS_OSX
  return super.placeholder;
#else
  return self.placeholderAttributedString.string ?: self.placeholderString;
#endif
} // ]TODO(macOS GH#774)

- (void)setPlaceholderColor:(RCTUIColor *)placeholderColor // TODO(OSS Candidate ISS#2710739)
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

- (void)setDefaultTextAttributes:(NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  if ([_defaultTextAttributes isEqualToDictionary:defaultTextAttributes]) {
    return;
  }

  _defaultTextAttributes = defaultTextAttributes;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [super setDefaultTextAttributes:defaultTextAttributes];
#endif // TODO(macOS GH#774)
  [self _updatePlaceholder];

#if TARGET_OS_OSX // [TODO(macOS GH#774)
  [self setAttributedText:[[NSAttributedString alloc] initWithString:[self text]
                                                          attributes:[self defaultTextAttributes]]];
#endif // ]TODO(macOS GH#774)
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)_updatePlaceholder
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
                                                               attributes:[self _placeholderTextAttributes]];
#else // [TODO(macOS GH#774)
  self.placeholderAttributedString = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
																	 attributes:[self _placeholderTextAttributes]];
#endif // ]TODO(macOS GH#774)
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  // on macos the super must be called otherwise its NSTextFieldCell editable property doesn't get set.
  [super setEditable:editable];
#endif // ]TODO(macOS GH#774)
  self.enabled = editable;
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)

- (void)setSecureTextEntry:(BOOL)secureTextEntry
{
  if (self.secureTextEntry == secureTextEntry) {
    return;
  }

  [super setSecureTextEntry:secureTextEntry];

  // Fix for trailing whitespate issue
  // Read more:
  // https://stackoverflow.com/questions/14220187/uitextfield-has-trailing-whitespace-after-securetextentry-toggle/22537788#22537788
  NSAttributedString *originalText = [self.attributedText copy];
  self.attributedText = [NSAttributedString new];
  self.attributedText = originalText;
}

#endif // ]TODO(macOS GH#774)


#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes = [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  // [TODO(OSS Candidate ISS#2710739)
  if (@available(iOS 13.0, *)) {
    [textAttributes setValue:self.placeholderColor ?: [RCTUIColor placeholderTextColor]
                      forKey:NSForegroundColorAttributeName];
  } else {
  // ]TODO(OSS Candidate ISS#2710739)
    if (self.placeholderColor) {
      [textAttributes setValue:self.placeholderColor forKey:NSForegroundColorAttributeName];
    } else {
      [textAttributes removeObjectForKey:NSForegroundColorAttributeName];
    }
  }

  return textAttributes;
}

#pragma mark - Context Menu

#if !TARGET_OS_OSX // [TODO(macOS GH#774)

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}

#pragma mark - Caret Manipulation

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}

#pragma mark - Positioning Overrides

- (CGRect)textRectForBounds:(CGRect)bounds
{
  return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}
  
#else // [TODO(macOS GH#774)
  
#pragma mark - NSTextViewDelegate methods

- (void)textDidChange:(NSNotification *)notification
{
  [super textDidChange:notification];
  id<RCTUITextFieldDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(textFieldDidChange:)]) {
    [delegate textFieldDidChange:self];
  }
}
  
- (void)textDidEndEditing:(NSNotification *)notification
{
  [super textDidEndEditing:notification];    
  id<RCTUITextFieldDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(textFieldEndEditing:)]) {
    [delegate textFieldEndEditing:self];
  }
}
  
- (void)textViewDidChangeSelection:(NSNotification *)notification
{
  id<RCTUITextFieldDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(textFieldDidChangeSelection:)]) {
    [delegate textFieldDidChangeSelection:self];
  }
}

- (BOOL)textView:(NSTextView *)aTextView shouldChangeTextInRange:(NSRange)aRange replacementString:(NSString *)aString
{
  id<RCTUITextFieldDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(textField:shouldChangeCharactersInRange:replacementString:)]) {
    return [delegate textField:self shouldChangeCharactersInRange:aRange replacementString:aString];
  }
  return NO;
}
  
#endif // ]TODO(macOS GH#774)

#pragma mark - Overrides

#if !TARGET_OS_OSX
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// Overrides selectedTextRange setter to get notify when selectedTextRange changed.
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange
{
  [super setSelectedTextRange:selectedTextRange];
  [_textInputDelegateAdapter selectedTextRangeWasSet];
}
#pragma clang diagnostic pop
#endif // !TARGET_OS_OSX

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (BOOL)becomeFirstResponder
{
  BOOL isFirstResponder = [super becomeFirstResponder];
  if (isFirstResponder) {
    id<RCTUITextFieldDelegate> delegate = self.delegate;
    if ([delegate respondsToSelector:@selector(textFieldBeginEditing:)]) {
      // The AppKit -[NSTextField textDidBeginEditing:] notification is only called when the user
      // makes the first change to the text in the text field.
      // The react-native -[RCTUITextFieldDelegate textFieldBeginEditing:] is intended to be
      // called when the text field is focused so call it here in becomeFirstResponder.
      [delegate textFieldBeginEditing:self];
    }

    NSScrollView *scrollView = [self enclosingScrollView];
    if (scrollView != nil) {
      NSRect visibleRect = [[scrollView documentView] convertRect:self.frame fromView:self];
      [[scrollView documentView] scrollRectToVisible:visibleRect];
    }
  }
  return isFirstResponder;
}

- (BOOL)performKeyEquivalent:(NSEvent *)event
{
  // The currentEditor is NSText for historical reasons, but documented to be NSTextView.
  NSTextView *currentEditor = (NSTextView *)self.currentEditor;
  // The currentEditor is non-nil when focused and hasMarkedText means an IME is open.
  if (currentEditor && !currentEditor.hasMarkedText && ![self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    return YES; // Don't send currentEditor the keydown event.
  }
  return [super performKeyEquivalent:event];
}
#endif // ]TODO(macOS GH#774)
	
#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
}

- (void)paste:(id)sender
{
  [super paste:sender];
  _textWasPasted = YES;
}
#else // [TODO(macOS GH#774)
- (void)setSelectedTextRange:(NSRange)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }
  
  [[self currentEditor] setSelectedRange:selectedTextRange];
}

- (NSRange)selectedTextRange
{
  return [[self currentEditor] selectedRange];
}
#endif // ]TODO(macOS GH#774)

#pragma mark - Layout

- (CGSize)contentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return self.intrinsicContentSize;
}

- (CGSize)intrinsicContentSize
{
  // Note: `placeholder` defines intrinsic size for `<TextInput>`.
  NSString *text = self.placeholder ?: @"";
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGSize size = [text sizeWithAttributes:[self _placeholderTextAttributes]];
  size = CGSizeMake(RCTCeilPixelValue(size.width), RCTCeilPixelValue(size.height));
#else // [TODO(macOS GH#774)
  CGSize size = [text sizeWithAttributes:@{NSFontAttributeName: self.font}];
  CGFloat scale = self.window.backingScaleFactor;
  RCTAssert(scale != 0.0, @"Layout occurs before the view is in a window?");
  if (scale == 0) {
    scale = [[NSScreen mainScreen] backingScaleFactor];
  }
  size = CGSizeMake(RCTCeilPixelValue(size.width, scale), RCTCeilPixelValue(size.height, scale));
#endif // ]TODO(macOS GH#774)
  size.width += _textContainerInset.left + _textContainerInset.right;
  size.height += _textContainerInset.top + _textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // All size values here contain `textContainerInset` (aka `padding`).
  CGSize intrinsicSize = self.intrinsicContentSize;
  return CGSizeMake(MIN(size.width, intrinsicSize.width), MIN(size.height, intrinsicSize.height));
}

#if !TARGET_OS_OSX // [TODO(OSS Candidate ISS#2710739)
- (void)deleteBackward {
  id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
  if ([textInputDelegate textInputShouldHandleDeleteBackward:self]) {
    [super deleteBackward];
  }
}
#else
- (void)keyUp:(NSEvent *)event {
  if ([self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    [super keyUp:event];
  }
}
#endif // ]TODO(OSS Candidate ISS#2710739)

@end
