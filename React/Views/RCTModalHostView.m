/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModalHostView.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTModalHostViewController.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "UIView+React.h"

@implementation RCTModalHostView
{
  RCTBridge *_bridge;
  BOOL _hasModalView;
  RCTModalHostViewController *_modalViewController;
  RCTTouchHandler *_touchHandler;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:coder)

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [RCTModalHostViewController new];
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];

    __weak RCTModalHostView *weakSelf = self;
    _modalViewController.boundsDidChangeBlock = ^(CGRect newBounds) {
      [weakSelf notifyForBoundsChange:newBounds];
    };
  }

  return self;
}

- (void)notifyForBoundsChange:(CGRect)newBounds
{
  if (_hasModalView) {
    [_bridge.uiManager setFrame:newBounds forView:_modalViewController.view];
  }
}

- (NSArray *)reactSubviews
{
  return _hasModalView ? @[_modalViewController.view] : @[];
}

- (void)insertReactSubview:(UIView *)subview atIndex:(__unused NSInteger)atIndex
{
  [subview addGestureRecognizer:_touchHandler];
  _modalViewController.view = subview;
  _hasModalView = YES;
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(subview == _modalViewController.view, @"Cannot remove view other than modal view");
  _modalViewController.view = nil;
  _hasModalView = NO;
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];

  if (self.superview) {
    RCTAssert(self.reactViewController, @"Can't present modal view controller without a presenting view controller");
    [self.reactViewController presentViewController:_modalViewController animated:self.animated completion:nil];
  } else {
    [_modalViewController dismissViewControllerAnimated:self.animated completion:nil];
  }
}

- (void)invalidate
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [_modalViewController dismissViewControllerAnimated:self.animated completion:nil];
  });
}

- (BOOL)isTransparent
{
  return _modalViewController.modalPresentationStyle == UIModalPresentationCustom;
}

- (void)setTransparent:(BOOL)transparent
{
  _modalViewController.modalPresentationStyle = transparent ? UIModalPresentationCustom : UIModalPresentationFullScreen;
}

@end
