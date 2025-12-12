/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostView.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <UIKit/UIKit.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTModalHostViewController.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTModalHostView {
  __weak RCTBridge *_bridge;
  BOOL _isPresented;
  RCTModalHostViewController *_modalViewController;
  RCTTouchHandler *_touchHandler;
  UIView *_reactSubview;
  UIInterfaceOrientation _lastKnownOrientation;
  RCTDirectEventBlock _onRequestClose;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : coder)

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [RCTModalHostViewController new];
    _modalViewController.modalInPresentation = YES;
    UIView *containerView = [UIView new];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _modalViewController.view = containerView;
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    _isPresented = NO;

    __weak typeof(self) weakSelf = self;
    _modalViewController.boundsDidChangeBlock = ^(CGRect newBounds) {
      [weakSelf notifyForBoundsChange:newBounds];
    };
  }

  return self;
}

- (void)setAllowSwipeDismissal:(BOOL)allowSwipeDismissal
{
  if (_allowSwipeDismissal != allowSwipeDismissal) {
    _allowSwipeDismissal = allowSwipeDismissal;
    _modalViewController.modalInPresentation = !allowSwipeDismissal;
  }
}

- (void)notifyForBoundsChange:(CGRect)newBounds
{
  if (_reactSubview && _isPresented) {
    [_bridge.uiManager setSize:newBounds.size forView:_reactSubview];
    [self notifyForOrientationChange];
  }
}

- (void)setOnRequestClose:(RCTDirectEventBlock)onRequestClose
{
  _onRequestClose = onRequestClose;
}

- (void)presentationControllerDidAttemptToDismiss:(UIPresentationController *)controller
{
  if (_onRequestClose != nil) {
    _onRequestClose(nil);
  }
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if (_onRequestClose != nil && _allowSwipeDismissal) {
    _onRequestClose(nil);
  }
}

- (void)notifyForOrientationChange
{
  if (!_onOrientationChange) {
    return;
  }

  UIInterfaceOrientation currentOrientation = RCTKeyWindow().windowScene.interfaceOrientation;
  if (currentOrientation == _lastKnownOrientation) {
    return;
  }
  _lastKnownOrientation = currentOrientation;

  BOOL isPortrait = currentOrientation == UIInterfaceOrientationPortrait ||
      currentOrientation == UIInterfaceOrientationPortraitUpsideDown;
  NSDictionary *eventPayload = @{
    @"orientation" : isPortrait ? @"portrait" : @"landscape",
  };
  _onOrientationChange(eventPayload);
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  RCTAssert(_reactSubview == nil, @"Modal view can only have one subview");
  [super insertReactSubview:subview atIndex:atIndex];
  [_touchHandler attachToView:subview];

  [_modalViewController.view insertSubview:subview atIndex:0];
  _reactSubview = subview;
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(subview == _reactSubview, @"Cannot remove view other than modal view");
  // Superclass (category) removes the `subview` from actual `superview`.
  [super removeReactSubview:subview];
  [_touchHandler detachFromView:subview];
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
    [self setVisible:NO];
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  // In the case where there is a LayoutAnimation, we will be reinserted into the view hierarchy but only for aesthetic
  // purposes. In such a case, we should NOT represent the <Modal>.
  if (!self.userInteractionEnabled && ![self.superview.reactSubviews containsObject:self]) {
    return;
  }

  [self ensurePresentedOnlyIfNeeded];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [self ensurePresentedOnlyIfNeeded];
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

- (void)setVisible:(BOOL)visible
{
  if (_visible != visible) {
    _visible = visible;
    [self ensurePresentedOnlyIfNeeded];
  }
}

- (void)ensurePresentedOnlyIfNeeded
{
  BOOL shouldBePresented = !_isPresented && _visible && self.window;
  if (shouldBePresented) {
    RCTAssert(self.reactViewController, @"Can't present modal view controller without a presenting view controller");

    _modalViewController.supportedInterfaceOrientations = [self supportedOrientationsMask];

    if ([self.animationType isEqualToString:@"fade"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    } else if ([self.animationType isEqualToString:@"slide"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    }
    if (self.presentationStyle != UIModalPresentationNone) {
      _modalViewController.modalPresentationStyle = self.presentationStyle;
    }

    _modalViewController.presentationController.delegate = self;

    [_delegate presentModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
    _isPresented = YES;
  }

  BOOL shouldBeHidden = _isPresented && (!_visible || !self.superview);
  if (shouldBeHidden) {
    [self dismissModalViewController];
  }
}

- (void)setTransparent:(BOOL)transparent
{
  if (self.isTransparent != transparent) {
    return;
  }

  _modalViewController.modalPresentationStyle =
      transparent ? UIModalPresentationOverFullScreen : UIModalPresentationFullScreen;
}

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

@end

#endif // RCT_REMOVE_LEGACY_ARCH
