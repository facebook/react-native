/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

//the UITextSelectionRect subclass needs to be created because the original version is not writable
@interface CustomTextSelectionRect : UITextSelectionRect

@property (nonatomic) CGRect _rect;
@property (nonatomic) NSWritingDirection _writingDirection;
@property (nonatomic) BOOL _containsStart; // Returns YES if the rect contains the start of the selection.
@property (nonatomic) BOOL _containsEnd; // Returns YES if the rect contains the end of the selection.
@property (nonatomic) BOOL _isVertical; // Returns YES if the rect is for vertically oriented text.

@end

@implementation CustomTextSelectionRect

- (CGRect)rect {
  return __rect;
}

- (NSWritingDirection)writingDirection {
  return __writingDirection;
}

- (BOOL)containsStart {
  return __containsStart;
}

- (BOOL)containsEnd {
  return __containsEnd;
}

- (BOOL)isVertical {
  return __isVertical;
}

@end


@implementation RCTUITextField {
  RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

    _textInputDelegateAdapter = [[RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
    _scrollEnabled = YES;
  }

  return self;
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
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented
  // inside the component.
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

- (void)setDefaultTextAttributes:(NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  if ([_defaultTextAttributes isEqualToDictionary:defaultTextAttributes]) {
    return;
  }

  _defaultTextAttributes = defaultTextAttributes;
  [super setDefaultTextAttributes:defaultTextAttributes];
  [self _updatePlaceholder];
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)_updatePlaceholder
{
  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
                                                               attributes:[self _placeholderTextAttributes]];
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
  self.enabled = editable;
}

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

#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];
  CGFloat baseLineOffset = [[textAttributes objectForKey:NSBaselineOffsetAttributeName] floatValue];
  if (baseLineOffset > 0) {
    // [textAttributes setValue:@(baseLineOffset / 2.0) forKey:NSBaselineOffsetAttributeName];
  }
  if (self.placeholderColor) {
    [textAttributes setValue:self.placeholderColor forKey:NSForegroundColorAttributeName];
  } else {
    [textAttributes removeObjectForKey:NSForegroundColorAttributeName];
  }

  return textAttributes;
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
  CGRect originalRect = [super caretRectForPosition:position];
  
  if (_caretHidden) {
    return CGRectZero;
  }
  
  // NSNumber *baseLineOffset = [self.attributedText valueForKey:NSBaselineOffsetAttributeName];
  // CGFloat baseLineOffset = 0;
  // CGFloat zero = 0;
  // search how to do this in objc with float
  // if (![baseLineOffset isEqual:0]) {
  // originalRect.origin.y -= [[self.defaultTextAttributes valueForKey:NSBaselineOffsetAttributeName] floatValue] / 2.0;
  // }
  
  return originalRect;
}

/*
- (NSArray *)selectionRectsForRange:(UITextRange *)range {
  NSArray *superRects = [super selectionRectsForRange:range];
    NSMutableArray *customTextSelectionRects = [NSMutableArray array];
    
    for (UITextSelectionRect *rect in superRects) {
      CustomTextSelectionRect *customTextRect = [[CustomTextSelectionRect alloc] init];
      
      customTextRect._rect = CGRectMake(rect.rect.origin.x, rect.rect.origin.y - [self.defaultTextAttributes[NSBaselineOffsetAttributeName] floatValue] / 2 , rect.rect.size.width, rect.rect.size.height);
      customTextRect._writingDirection = rect.writingDirection;
      customTextRect._containsStart = rect.containsStart;
      customTextRect._containsEnd = rect.containsEnd;
      customTextRect._isVertical = rect.isVertical;
      [customTextSelectionRects addObject:customTextRect];
    }
    
  return customTextSelectionRects;
  
}
 */

#pragma mark - Positioning Overrides

- (CGRect)textRectForBounds:(CGRect)bounds
{
  if (self.reactTextInsets.size.height > 0) {
    return self.reactTextInsets;
  } else {
    return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
  }
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  if (self.reactEditingInsets.size.height > 0) {
    return self.reactEditingInsets;
  } else {
    return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
  }
}

- (CGRect)placeholderRectForBounds:(CGRect)bounds
{
  return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
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
  _textWasPasted = YES;
  [super paste:sender];
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

@end
