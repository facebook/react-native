/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostView.h"

#import <UIKit/UIKit.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTModalHostViewController.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"
#if TARGET_OS_TV
#import "RCTTVRemoteHandler.h"
#endif

@implementation RCTModalHostView
{
  __weak RCTBridge *_bridge;
  BOOL _isPresented;
  RCTModalHostViewController *_modalViewController;
  RCTTouchHandler *_touchHandler;
  UIView *_reactSubview;
#if TARGET_OS_TV
  UITapGestureRecognizer *_menuButtonGestureRecognizer;
#else
  UIInterfaceOrientation _lastKnownOrientation;
#endif

}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:coder)

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [RCTModalHostViewController new];
    UIView *containerView = [UIView new];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _modalViewController.view = containerView;
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
#if TARGET_OS_TV
    _menuButtonGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(menuButtonPressed:)];
    _menuButtonGestureRecognizer.allowedPressTypes = @[@(UIPressTypeMenu)];
    self.tvRemoteHandler = [RCTTVRemoteHandler new];
#endif
    _isPresented = NO;

    __weak typeof(self) weakSelf = self;
    _modalViewController.boundsDidChangeBlock = ^(CGRect newBounds) {
      [weakSelf notifyForBoundsChange:newBounds];
    };
  }

  return self;
}

#if TARGET_OS_TV
- (void)menuButtonPressed:(__unused UIGestureRecognizer *)gestureRecognizer
{
    if (_onRequestClose) {
        _onRequestClose(nil);
    }
}

- (void)setOnRequestClose:(RCTDirectEventBlock)onRequestClose
{
  _onRequestClose = onRequestClose;
  if (_reactSubview) {
    if (_onRequestClose && _menuButtonGestureRecognizer) {
      [_reactSubview addGestureRecognizer:_menuButtonGestureRecognizer];
    } else {
      [_reactSubview removeGestureRecognizer:_menuButtonGestureRecognizer];
    }
  }
}
#endif

- (void)notifyForBoundsChange:(CGRect)newBounds
{
  if (_reactSubview && _isPresented) {
    [_bridge.uiManager setSize:newBounds.size forView:_reactSubview];
    [self notifyForOrientationChange];
  }
}

- (void)notifyForOrientationChange
{
#if !TARGET_OS_TV
  if (!_onOrientationChange) {
    return;
  }

  UIInterfaceOrientation currentOrientation = [RCTSharedApplication() statusBarOrientation];
  if (currentOrientation == _lastKnownOrientation) {
    return;
  }
  _lastKnownOrientation = currentOrientation;

  BOOL isPortrait = currentOrientation == UIInterfaceOrientationPortrait || currentOrientation == UIInterfaceOrientationPortraitUpsideDown;
  NSDictionary *eventPayload =
  @{
    @"orientation": isPortrait ? @"portrait" : @"landscape",
    };
  _onOrientationChange(eventPayload);
#endif
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  RCTAssert(_reactSubview == nil, @"Modal view can only have one subview");
  [super insertReactSubview:subview atIndex:atIndex];
  [_touchHandler attachToView:subview];
#if TARGET_OS_TV
  for (NSString *key in [self.tvRemoteHandler.tvRemoteGestureRecognizers allKeys]) {
    if (![key isEqualToString:RCTTVRemoteEventMenu]) {
      [subview addGestureRecognizer:self.tvRemoteHandler.tvRemoteGestureRecognizers[key]];
    }
  }
  if (_onRequestClose) {
    [subview addGestureRecognizer:_menuButtonGestureRecognizer];
  }
#endif

  [_modalViewController.view insertSubview:subview atIndex:0];
  _reactSubview = subview;
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(subview == _reactSubview, @"Cannot remove view other than modal view");
  // Superclass (category) removes the `subview` from actual `superview`.
  [super removeReactSubview:subview];
  [_touchHandler detachFromView:subview];
#if TARGET_OS_TV
  if (_menuButtonGestureRecognizer) {
    [subview removeGestureRecognizer:_menuButtonGestureRecognizer];
  }
  for (UIGestureRecognizer *gr in self.tvRemoteHandler.tvRemoteGestureRecognizers) {
    [subview removeGestureRecognizer:gr];
  }
#endif
  _reactSubview = nil;
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subview (singular) is managed by `insertReactSubview:atIndex:`
}

- (void)dismissModalViewController
{
  if (_isPresented) {
    [_delegate dismissModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
    _isPresented = NO;
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  // In the case where there is a LayoutAnimation, we will be reinserted into the view hierarchy but only for aesthetic purposes.
  // In such a case, we should NOT represent the <Modal>.
  if (!self.userInteractionEnabled && ![self.superview.reactSubviews containsObject:self]) {
    return;
  }

  if (!_isPresented && self.window) {
    RCTAssert(self.reactViewController, @"Can't present modal view controller without a presenting view controller");

#if !TARGET_OS_TV
    _modalViewController.supportedInterfaceOrientations = [self supportedOrientationsMask];
#endif
    if ([self.animationType isEqualToString:@"fade"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    } else if ([self.animationType isEqualToString:@"slide"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    }
    if (self.presentationStyle != UIModalPresentationNone) {
      _modalViewController.modalPresentationStyle = self.presentationStyle;
    }
    [_delegate presentModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
    _isPresented = YES;
  }
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];

  if (_isPresented && !self.superview) {
    [self dismissModalViewController];
  }
}

- (void)invalidate
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self dismissModalViewController];
  });
}

- (BOOL)isTransparent
{
  return _modalViewController.modalPresentationStyle == UIModalPresentationOverFullScreen;
}

- (BOOL)hasAnimationType
{
  return ![self.animationType isEqualToString:@"none"];
}

- (void)setTransparent:(BOOL)transparent
{
  if (self.isTransparent != transparent) {
    return;
  }

  _modalViewController.modalPresentationStyle = transparent ? UIModalPresentationOverFullScreen : UIModalPresentationFullScreen;
}

#if !TARGET_OS_TV
- (UIInterfaceOrientationMask)supportedOrientationsMask
{
  if (_supportedOrientations.count == 0) {
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
      return UIInterfaceOrientationMaskAll;
    } else {
      return UIInterfaceOrientationMaskPortrait;
    }
  }

  UIInterfaceOrientationMask supportedOrientations = 0;
  for (NSString *orientation in _supportedOrientations) {
    if ([orientation isEqualToString:@"portrait"]) {
      supportedOrientations |= UIInterfaceOrientationMaskPortrait;
    } else if ([orientation isEqualToString:@"portrait-upside-down"]) {
      supportedOrientations |= UIInterfaceOrientationMaskPortraitUpsideDown;
    } else if ([orientation isEqualToString:@"landscape"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscape;
    } else if ([orientation isEqualToString:@"landscape-left"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscapeLeft;
    } else if ([orientation isEqualToString:@"landscape-right"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscapeRight;
    }
  }
  return supportedOrientations;
}
#endif

@end
