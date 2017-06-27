/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextInput.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>
#import <React/RCTUIManager.h>
#import <React/UIView+React.h>

@implementation RCTTextInput {
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  RCTAssert(NO, @"-[RCTTextInput backedTextInputView] must be implemented in subclass.");
  return nil;
}

#pragma mark - Properties

- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  _reactPaddingInsets = reactPaddingInsets;
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = reactPaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  _reactBorderInsets = reactBorderInsets;
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
}

#pragma mark - Content Size (in Yoga terms, without any insets)

- (CGSize)contentSize
{
  CGSize contentSize = self.intrinsicContentSize;
  UIEdgeInsets compoundInsets = self.reactCompoundInsets;
  contentSize.width -= compoundInsets.left + compoundInsets.right;
  contentSize.height -= compoundInsets.top + compoundInsets.bottom;
  // Returning value does NOT include border and padding insets.
  return contentSize;
}

- (void)invalidateContentSize
{
  // Updates `contentSize` property and notifies Yoga about the change, if necessary.
  CGSize contentSize = self.contentSize;

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  [_bridge.uiManager setIntrinsicContentSize:contentSize forView:self];

  if (_onContentSizeChange) {
    _onContentSizeChange(@{
      @"contentSize": @{
        @"height": @(contentSize.height),
        @"width": @(contentSize.width),
      },
      @"target": self.reactTag,
    });
  }
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  CGSize size = self.backedTextInputView.intrinsicContentSize;
  size.width += _reactBorderInsets.left + _reactBorderInsets.right;
  size.height += _reactBorderInsets.top + _reactBorderInsets.bottom;
  // Returning value DOES include border and padding insets.
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _reactBorderInsets.left + _reactBorderInsets.right;
  CGFloat compoundVerticalBorderInset = _reactBorderInsets.top + _reactBorderInsets.bottom;

  size.width -= compoundHorizontalBorderInset;
  size.height -= compoundVerticalBorderInset;

  // Note: `paddingInsets` was already included in `backedTextInputView` size
  // because it was applied as `textContainerInset`.
  CGSize fittingSize = [self.backedTextInputView sizeThatFits:size];

  fittingSize.width += compoundHorizontalBorderInset;
  fittingSize.height += compoundVerticalBorderInset;

  // Returning value DOES include border and padding insets.
  return fittingSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self invalidateContentSize];
}

#pragma mark - Accessibility

- (UIView *)reactAccessibleView
{
  return self.backedTextInputView;
}

#pragma mark - Focus Control

- (void)reactFocus
{
  [self.backedTextInputView reactFocus];
}

- (void)reactBlur
{
  [self.backedTextInputView reactBlur];
}

- (void)didMoveToWindow
{
  [self.backedTextInputView reactFocusIfNeeded];
}

#pragma mark - Custom Input Accessory View

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [self invalidateInputAccessoryView];
}

- (void)invalidateInputAccessoryView
{
#if !TARGET_OS_TV
  UIView<RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  UIKeyboardType keyboardType = textInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccesoryView =
    (
      keyboardType == UIKeyboardTypeNumberPad ||
      keyboardType == UIKeyboardTypePhonePad ||
      keyboardType == UIKeyboardTypeDecimalPad ||
      keyboardType == UIKeyboardTypeASCIICapableNumberPad
    ) &&
    textInputView.returnKeyType == UIReturnKeyDone;

  BOOL hasInputAccesoryView = textInputView.inputAccessoryView != nil;

  if (hasInputAccesoryView == shouldHaveInputAccesoryView) {
    return;
  }

  if (shouldHaveInputAccesoryView) {
    UIToolbar *toolbarView = [[UIToolbar alloc] init];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace
                                                    target:nil
                                                    action:nil];
    UIBarButtonItem *doneButton =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                    target:self
                                                    action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[flexibleSpace, doneButton];
    textInputView.inputAccessoryView = toolbarView;
  }
  else {
    textInputView.inputAccessoryView = nil;
  }

  // We have to call `reloadInputViews` for focused text inputs to update an accessory view.
  if (textInputView.isFirstResponder) {
    [textInputView reloadInputViews];
  }
#endif
}

- (void)handleInputAccessoryDoneButton
{
  [self.backedTextInputView endEditing:YES];
}

@end
