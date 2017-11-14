/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSurfaceView.h"
#import "RCTSurfaceView+Internal.h"

#import "RCTDefines.h"
#import "RCTSurface.h"
#import "RCTSurfaceRootView.h"

@implementation RCTSurfaceView {
  RCTSurfaceRootView *_Nullable _rootView;
  UIView *_Nullable _activityIndicatorView;
  RCTSurfaceStage _stage;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (nullable instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)initWithSurface:(RCTSurface *)surface
{
  if (self = [super initWithFrame:CGRectZero]) {
    _stage = surface.stage;
    _surface = surface;
  }

  return self;
}

#pragma mark - Internal Interface

- (void)setRootView:(RCTSurfaceRootView *)rootView
{
  if (_rootView == rootView) {
    return;
  }

  [_rootView removeFromSuperview];
  _rootView = rootView;
  [self updateStage];
}

- (RCTSurfaceRootView *)rootView
{
  return _rootView;
}

#pragma mark - activityIndicatorView

- (void)setActivityIndicatorView:(UIView *)view
{
  [_activityIndicatorView removeFromSuperview];
  _activityIndicatorView = view;
  _activityIndicatorView.frame = self.bounds;
  _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self addSubview:_activityIndicatorView];
}

- (UIView *)activityIndicatorView
{
  return _activityIndicatorView;
}

#pragma mark - stage

- (void)setStage:(RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  _stage = stage;

  [self updateStage];
}

- (RCTSurfaceStage)stage
{
  return _stage;
}

#pragma mark - Visibility

- (void)updateStage
{
  BOOL displayRootView = _stage & RCTSurfaceStageSurfaceDidInitialLayout;
  BOOL displayActivityIndicator = !displayRootView;

  if (displayRootView) {
    if (_rootView.superview != self) {
      [self addSubview:_rootView];
    }
  }
  else {
    [_rootView removeFromSuperview];
  }

  if (displayActivityIndicator) {
    if (!_activityIndicatorView && self.activityIndicatorViewFactory != nil) {
      self.activityIndicatorView = self.activityIndicatorViewFactory();
    }
  }
  else {
    [_activityIndicatorView removeFromSuperview];
  }
}

@end
