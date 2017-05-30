/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUITextField.h"

#import <React/RCTUtils.h>
#import <React/UIView+React.h>

@implementation RCTUITextField

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];
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

- (void)_updatePlaceholder
{
  if (self.placeholder == nil) {
    return;
  }

  NSMutableDictionary *attributes = [NSMutableDictionary new];
  if (_placeholderColor) {
    [attributes setObject:_placeholderColor forKey:NSForegroundColorAttributeName];
  }

  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                               attributes:attributes];
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

#pragma mark - Layout

- (CGSize)intrinsicContentSize
{
  // Note: `placeholder` defines intrinsic size for `<TextInput>`.
  NSString *text = self.placeholder ?: @"";
  CGSize size = [text sizeWithAttributes:@{NSFontAttributeName: self.font}];
  size = CGSizeMake(RCTCeilPixelValue(size.width), RCTCeilPixelValue(size.height));
  size.width += _textContainerInset.left + _textContainerInset.right;
  size.height += _textContainerInset.top + _textContainerInset.bottom;
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGSize intrinsicSize = self.intrinsicContentSize;
  return CGSizeMake(MIN(size.width, intrinsicSize.width), MIN(size.height, intrinsicSize.height));
}

@end
