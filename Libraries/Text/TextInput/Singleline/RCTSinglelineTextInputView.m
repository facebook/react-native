/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSinglelineTextInputView.h"

#import <React/RCTBridge.h>

#import "RCTUITextField.h"

@implementation RCTSinglelineTextInputView
{
  RCTUITextField *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    self.blurOnSubmit = YES;

    _backedTextInputView = [[RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  [super setReactPaddingInsets:reactPaddingInsets];
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInsets` on mac.
  ((RCTUITextField*)self.backedTextInputView).textContainerInset = reactPaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  [super setReactBorderInsets:reactBorderInsets];
  // We apply `borderInsets` as `backedTextInputView`'s layout offset on mac.
  ((RCTUITextField*)self.backedTextInputView).frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
}
#endif // ]TODO(macOS ISS#2323203)

@end
