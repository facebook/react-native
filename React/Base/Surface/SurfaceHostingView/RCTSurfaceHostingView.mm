/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSurfaceHostingView.h"

#import "RCTDefines.h"
#import "RCTSurface.h"
#import "RCTSurfaceDelegate.h"
#import "RCTSurfaceView.h"
#import "RCTUtils.h"

@interface RCTSurfaceHostingView () <RCTSurfaceDelegate>

@property (nonatomic, assign) BOOL isActivityIndicatorViewVisible;
@property (nonatomic, assign) BOOL isSurfaceViewVisible;

@end

@implementation RCTSurfaceHostingView {
  UIView *_Nullable _activityIndicatorView;
  UIView *_Nullable _surfaceView;
  RCTSurfaceStage _stage;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (nullable instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  RCTSurface *surface =
    [[RCTSurface alloc] initWithBridge:bridge
                            moduleName:moduleName
                     initialProperties:initialProperties];

  return [self initWithSurface:surface];
}

- (instancetype)initWithSurface:(RCTSurface *)surface
{
  if (self = [super initWithFrame:CGRectZero]) {
    _surface = surface;

    _sizeMeasureMode =
      RCTSurfaceSizeMeasureModeWidthAtMost |
      RCTSurfaceSizeMeasureModeHeightAtMost;

    _surface.delegate = self;
    _stage = surface.stage;
    [self _updateViews];
  }

  return self;
}

- (CGSize)intrinsicContentSize
{
  if (RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return _activityIndicatorView.intrinsicContentSize;
    }

    return CGSizeZero;
  }

  return _surface.intrinsicSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return [_activityIndicatorView sizeThatFits:size];
    }

    return CGSizeZero;
  }

  CGSize minimumSize = CGSizeZero;
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  if (_sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthExact) {
    minimumSize.width = size.width;
    maximumSize.width = size.width;
  }
  else if (_sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthAtMost) {
    maximumSize.width = size.width;
  }

  if (_sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightExact) {
    minimumSize.height = size.height;
    maximumSize.height = size.height;
  }
  else if (_sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightAtMost) {
    maximumSize.height = size.height;
  }

  return [_surface sizeThatFitsMinimumSize:minimumSize
                               maximumSize:maximumSize];
}

- (void)setStage:(RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  BOOL shouldInvalidateLayout =
    RCTSurfaceStageIsRunning(stage) != RCTSurfaceStageIsRunning(_stage) ||
    RCTSurfaceStageIsPreparing(stage) != RCTSurfaceStageIsPreparing(_stage);

  _stage = stage;

  if (shouldInvalidateLayout) {
    [self _invalidateLayout];
    [self _updateViews];
  }
}

- (void)setSizeMeasureMode:(RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (sizeMeasureMode == _sizeMeasureMode) {
    return;
  }

  _sizeMeasureMode = sizeMeasureMode;
  [self _invalidateLayout];
}

#pragma mark - isActivityIndicatorViewVisible

- (void)setIsActivityIndicatorViewVisible:(BOOL)visible
{
  if (_isActivityIndicatorViewVisible == visible) {
    return;
  }

  if (visible) {
    if (_activityIndicatorViewFactory) {
      _activityIndicatorView = _activityIndicatorViewFactory();
      _activityIndicatorView.frame = self.bounds;
      _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:_activityIndicatorView];
    }
  } else {
    [_activityIndicatorView removeFromSuperview];
    _activityIndicatorView = nil;
  }
}

#pragma mark - isSurfaceViewVisible

- (void)setIsSurfaceViewVisible:(BOOL)visible
{
  if (_isSurfaceViewVisible == visible) {
    return;
  }

  if (visible) {
    _surfaceView = _surface.view;
    _surfaceView.frame = self.bounds;
    _surfaceView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_surfaceView];
  } else {
    [_surfaceView removeFromSuperview];
    _surfaceView = nil;
  }
}

#pragma mark - activityIndicatorViewFactory

- (void)setActivityIndicatorViewFactory:(RCTSurfaceHostingViewActivityIndicatorViewFactory)activityIndicatorViewFactory
{
  _activityIndicatorViewFactory = activityIndicatorViewFactory;
  if (_isActivityIndicatorViewVisible) {
    _isActivityIndicatorViewVisible = NO;
    self.isActivityIndicatorViewVisible = YES;
  }
}

#pragma mark - Private stuff

- (void)_invalidateLayout
{
  [self.superview setNeedsLayout];
}

- (void)_updateViews
{
  self.isSurfaceViewVisible = RCTSurfaceStageIsRunning(_stage);
  self.isActivityIndicatorViewVisible = RCTSurfaceStageIsPreparing(_stage);
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self _updateViews];
}

#pragma mark - RCTSurfaceDelegate

- (void)surface:(RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage
{
  RCTExecuteOnMainQueue(^{
    [self setStage:stage];
  });
}

- (void)surface:(RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  RCTExecuteOnMainQueue(^{
    [self _invalidateLayout];
  });
}

@end
