/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInputAccessoryView.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTBridge.h>
#import <React/RCTTouchHandler.h>
#import <React/UIView+React.h>

#import <React/RCTInputAccessoryViewContent.h>

@interface RCTInputAccessoryView ()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation RCTInputAccessoryView {
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [RCTInputAccessoryViewContent new];
    RCTTouchHandler *const touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)reactSetFrame:(CGRect)frame
{
  [_inputAccessoryView reactSetFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactSubview:subview atIndex:index];
  [_inputAccessoryView insertReactSubview:subview atIndex:index];
}

- (void)removeReactSubview:(UIView *)subview
{
  [super removeReactSubview:subview];
  [_inputAccessoryView removeReactSubview:subview];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `insertReactSubview:atIndex:`.
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  // If the accessory view is not linked to a text input via nativeID, assume it is
  // a standalone component that should get focus whenever it is rendered.
  if (![changedProps containsObject:@"nativeID"] && !self.nativeID) {
    _shouldBecomeFirstResponder = YES;
  }
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
