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
  [self _updateStage];
}

- (RCTSurfaceRootView *)rootView
{
  return _rootView;
}

#pragma mark - stage

- (void)setStage:(RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  _stage = stage;

  [self _updateStage];
}

- (RCTSurfaceStage)stage
{
  return _stage;
}

#pragma mark - Private

- (void)_updateStage
{
  if (RCTSurfaceStageIsRunning(_stage)) {
    if (_rootView.superview != self) {
      [self addSubview:_rootView];
    }
  }
  else {
    [_rootView removeFromSuperview];
  }
}

@end
