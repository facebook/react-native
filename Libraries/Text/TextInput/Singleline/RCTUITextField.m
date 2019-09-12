/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>

#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTTextAttributes.h>

@implementation RCTUITextField {
  RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
}

@synthesize reactTextAttributes = _reactTextAttributes;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

    _textInputDelegateAdapter = [[RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)_textDidChange
{
  _textWasPasted = NO;
}

#pragma mark - Accessibility

- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
{
  // UITextField is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented inside the component.
}

#pragma mark - Properties

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  _textContainerInset = textContainerInset;
  [self setNeedsLayout];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  [super setPlaceholder:placeholder];
  [self _updatePlaceholder];
}

- (void)setPlaceholderColor:(UIColor *)placeholderColor
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

- (void)setReactTextAttributes:(RCTTextAttributes *)reactTextAttributes
{
  if ([reactTextAttributes isEqual:_reactTextAttributes]) {
    return;
  }
  self.defaultTextAttributes = reactTextAttributes.effectiveTextAttributes;
  _reactTextAttributes = reactTextAttributes;
  [self _updatePlaceholder];
}

- (RCTTextAttributes *)reactTextAttributes
{
  return _reactTextAttributes;
}

- (void)_updatePlaceholder
{
  if (self.placeholder == nil) {
    return;
  }

  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                               attributes:[self placeholderEffectiveTextAttributes]];
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
  self.enabled = editable;
}

- (void)setScrollEnabled:(BOOL)enabled
{
  // Do noting, compatible with multiline textinput
}

- (BOOL)scrollEnabled
{
  return NO;
}

#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)placeholderEffectiveTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *effectiveTextAttributes = [NSMutableDictionary dictionary];
  
  if (_placeholderColor) {
    effectiveTextAttributes[NSForegroundColorAttributeName] = _placeholderColor;
  }
  // Kerning
  if (!isnan(_reactTextAttributes.letterSpacing)) {
    effectiveTextAttributes[NSKernAttributeName] = @(_reactTextAttributes.letterSpacing);
  }
  
  NSParagraphStyle *paragraphStyle = [_reactTextAttributes effectiveParagraphStyle];
  if (paragraphStyle) {
    effectiveTextAttributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }
  
  return [effectiveTextAttributes copy];
}

#pragma mark - Context Menu

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

#pragma mark - Overrides

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// Overrides selectedTextRange setter to get notify when selectedTextRange changed.
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange
{
  [super setSelectedTextRange:selectedTextRange];
  [_textInputDelegateAdapter selectedTextRangeWasSet];
}
#pragma clang diagnostic pop

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
  CGSize size = [text sizeWithAttributes:[self placeholderEffectiveTextAttributes]];
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

@end
