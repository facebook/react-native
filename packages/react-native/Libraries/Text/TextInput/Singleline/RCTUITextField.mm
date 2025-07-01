/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTBackedTextInputDelegate.h> // [macOS]
#import <React/RCTTextAttributes.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTTouchHandler.h> // [macOS]

#if TARGET_OS_OSX // [macOS

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
@property (nonatomic, strong, nullable) RCTUIColor *insertionPointColor;

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
  fieldEditor.insertionPointColor = self.insertionPointColor ?: [NSColor textColor];
  return fieldEditor;
}

@end
#endif // macOS]

#ifdef RCT_SUBCLASS_SECURETEXTFIELD
@implementation RCTUISecureTextField {
#else
@implementation RCTUITextField {
#endif
  RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
#if TARGET_OS_OSX // [macOS
  BOOL _isUpdatingPlaceholderText;
#endif // macOS]
}

#if TARGET_OS_OSX // [macOS
@dynamic delegate;
#endif // macOS]

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
        
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

#if TARGET_OS_OSX // [macOS
    [self setBordered:NO];
    [self setAllowsEditingTextAttributes:YES];
    [self setBackgroundColor:[NSColor clearColor]];
#endif // macOS]

    _textInputDelegateAdapter = [[RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
    _scrollEnabled = YES;
#if TARGET_OS_OSX // [macOS
    _isUpdatingPlaceholderText = NO;
#endif // macOS]
  }

  return self;
}

#if TARGET_OS_OSX
- (NSRange)selectedRange {
  return [[self currentEditor] selectedRange];
}
#endif

- (void)_textDidChange
{
  _textWasPasted = NO;
#if TARGET_OS_OSX // [macOS
  [self setAttributedText:[[NSAttributedString alloc] initWithString:[self text]
                                                          attributes:[self defaultTextAttributes]]];
  if([[self text] length] == 0) {
    self.font = [[self defaultTextAttributes] objectForKey:NSFontAttributeName];
  }
#endif // macOS]
}

#if TARGET_OS_OSX // [macOS
- (BOOL)hasMarkedText
{
  return ((NSTextView *)self.currentEditor).hasMarkedText;
}

- (NSArray<NSAttributedStringKey> *)validAttributesForMarkedText
{
	return ((NSTextView *)self.currentEditor).validAttributesForMarkedText ?: @[];
}

#endif // macOS]
  
#pragma mark - Accessibility

#if !TARGET_OS_OSX // [macOS]
- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
#else // [macOS
- (void)setAccessibilityElement:(BOOL)isAccessibilityElement
#endif // macOS]
{
  // UITextField is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented
  // inside the component.
}

#pragma mark - Properties

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  if (UIEdgeInsetsEqualToEdgeInsets(textContainerInset, _textContainerInset)) {
    return;
  }

  _textContainerInset = textContainerInset;
#if !TARGET_OS_OSX // [macOS]
  [self setNeedsLayout];
#else // [macOS
  ((RCTUITextFieldCell*)self.cell).textContainerInset = _textContainerInset;

  if (self.currentEditor) {
    NSRange selectedRange = self.currentEditor.selectedRange;

    // Relocate the NSTextView without changing the selection.
    [self.cell selectWithFrame:self.bounds
                        inView:self
                        editor:self.currentEditor
                      delegate:self
                         start:selectedRange.location
                        length:selectedRange.length];
  }
#endif // macOS]
}

#if TARGET_OS_OSX // [macOS

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

- (void)setSelectionColor:(RCTUIColor *)selectionColor
{
  ((RCTUITextFieldCell*)self.cell).selectionColor = selectionColor;
}

- (RCTUIColor*)selectionColor
{
  return ((RCTUITextFieldCell*)self.cell).selectionColor;
}
    
- (void)setCursorColor:(NSColor *)cursorColor
{
    ((RCTUITextFieldCell*)self.cell).insertionPointColor = cursorColor;
}

- (RCTUIColor*)cursorColor
{
  return ((RCTUITextFieldCell*)self.cell).insertionPointColor;
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

#endif // macOS]

- (void)setPlaceholder:(NSString *)placeholder
{
#if !TARGET_OS_OSX // [macOS]
  [super setPlaceholder:placeholder];
#else // [macOS
  [super setPlaceholderString:placeholder];
#endif // macOS]
  [self _updatePlaceholder];
}

- (NSString*)placeholder // [macOS
{
#if !TARGET_OS_OSX // [macOS]
  return super.placeholder;
#else
  return self.placeholderAttributedString.string ?: self.placeholderString;
#endif
} // macOS]

- (void)setPlaceholderColor:(RCTUIColor *)placeholderColor // [macOS]
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
#if !TARGET_OS_OSX // [macOS]
  [super setDefaultTextAttributes:defaultTextAttributes];
#endif // [macOS]
  [self _updatePlaceholder];

#if TARGET_OS_OSX // [macOS
  [self setAttributedText:[[NSAttributedString alloc] initWithString:[self text]
                                                          attributes:[self defaultTextAttributes]]];

  self.font = [[self defaultTextAttributes] objectForKey:NSFontAttributeName];
#endif // macOS]
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)_updatePlaceholder
{
#if !TARGET_OS_OSX // [macOS]
  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
                                                               attributes:[self _placeholderTextAttributes]];
#else // [macOS
  // Set _isUpdatingPlaceholderText to manually suppress RCTUITextFieldDelegate's textFieldEndEditing
  _isUpdatingPlaceholderText = YES;
  self.placeholderAttributedString = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
																	 attributes:[self _placeholderTextAttributes]];
  _isUpdatingPlaceholderText = NO;
#endif // macOS]
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
#if TARGET_OS_OSX // [macOS
  // on macos the super must be called otherwise its NSTextFieldCell editable property doesn't get set.
  [super setEditable:editable];
#endif // macOS]
  self.enabled = editable;
}

#if !TARGET_OS_OSX // [macOS]

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

#endif // [macOS]


#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

    [textAttributes setValue:self.placeholderColor ?: [RCTUIColor placeholderTextColor]
                      forKey:NSForegroundColorAttributeName]; // [macOS]

  return textAttributes;
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

- (void)buildMenuWithBuilder:(id<UIMenuBuilder>)builder
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000
  if (@available(iOS 17.0, *)) {
    if (_contextMenuHidden) {
      [builder removeMenuForIdentifier:UIMenuAutoFill];
    }
  }
#endif

  [super buildMenuWithBuilder:builder];
}

#pragma mark - Dictation

- (void)dictationRecordingDidEnd
{
  _dictationRecognizing = YES;
}

- (void)removeDictationResultPlaceholder:(id)placeholder willInsertResult:(BOOL)willInsertResult
{
  [super removeDictationResultPlaceholder:placeholder willInsertResult:willInsertResult];
  _dictationRecognizing = NO;
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
  
#else // [macOS
  
#pragma mark - NSTextFieldDelegate methods

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

  // On macOS, setting placeholderAttributedString causes AppKit to call textDidEndEditing.
  // We don't want this to propagate or else we get unexpected onBlur/onEndEditing events.
  if (_isUpdatingPlaceholderText) {
    return;
  }

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
  
- (NSMenu *)textView:(NSTextView *)view menu:(NSMenu *)menu forEvent:(NSEvent *)event atIndex:(NSUInteger)charIndex
{
  if (menu) {
    [[RCTTouchHandler touchHandlerForView:self] willShowMenuWithEvent:event];
  }

  return menu;
}

#endif // macOS]

#pragma mark - Overrides

#if !TARGET_OS_OSX // [macOS]
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// Overrides selectedTextRange setter to get notify when selectedTextRange changed.
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange
{
  [super setSelectedTextRange:selectedTextRange];
  [_textInputDelegateAdapter selectedTextRangeWasSet];
}
#pragma clang diagnostic pop
#endif // [macOS]

#if TARGET_OS_OSX // [macOS
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
#endif // macOS]
	
#if !TARGET_OS_OSX // [macOS]
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
}

- (void)scrollRangeToVisible:(NSRange)range
{
  // Singleline TextInput does not require scrolling after calling setSelectedTextRange (PR 38679).
}

- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}
#else // [macOS
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
#endif // macOS]

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
  CGSize size = [text sizeWithAttributes:[self _placeholderTextAttributes]];
  size = CGSizeMake(RCTCeilPixelValue(size.width), RCTCeilPixelValue(size.height));
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

#if !TARGET_OS_OSX // [macOS]
- (void)deleteBackward {
  id<RCTBackedTextInputDelegate> textInputDelegate = [self textInputDelegate];
  if ([textInputDelegate textInputShouldHandleDeleteBackward:self]) {
    [super deleteBackward];
  }
}
#else // [macOS
- (void)keyUp:(NSEvent *)event {
  if ([self.textInputDelegate textInputShouldHandleKeyEvent:event]) {
    [super keyUp:event];
  }
}
#endif // macOS]

@end
