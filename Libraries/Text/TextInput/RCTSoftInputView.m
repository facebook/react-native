/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSoftInputView.h>

#import <React/RCTBridge.h>
#import <React/RCTTouchHandler.h>
#import <React/UIView+React.h>

#import <React/RCTSoftInputViewContent.h>

@interface RCTSoftInputView()

// Overriding `softInputView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputView;

@end

@implementation RCTSoftInputView

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputView = [RCTSoftInputViewContent new];
    RCTTouchHandler *const touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)reactSetFrame:(CGRect)frame
{
  [_inputView reactSetFrame:frame];
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactSubview:subview atIndex:index];
  [_inputView insertReactSubview:subview atIndex:index];
}

- (void)removeReactSubview:(UIView *)subview
{
  [super removeReactSubview:subview];
  [_inputView removeReactSubview:subview];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `insertReactSubview:atIndex:`.
}

@end
