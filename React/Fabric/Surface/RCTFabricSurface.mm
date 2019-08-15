/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurface.h"

#import <mutex>

#import <React/RCTAssert.h>
#import <React/RCTSurfaceDelegate.h>
#import <React/RCTSurfaceRootView.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUtils.h>

#import "RCTSurfacePresenter.h"

@implementation RCTFabricSurface {
  // Immutable
  RCTSurfacePresenter *_surfacePresenter;
  NSString *_moduleName;

  // Protected by the `_mutex`
  std::mutex _mutex;
  RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;

  // The Main thread only
  RCTSurfaceView *_Nullable _view;
  RCTSurfaceTouchHandler *_Nullable _touchHandler;
}

- (instancetype)initWithSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties
{
  if (self = [super init]) {
    _surfacePresenter = surfacePresenter;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootTag = [RCTAllocateRootViewTag() integerValue];

    _minimumSize = CGSizeZero;
    // FIXME: Replace with `_maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);`.
    _maximumSize = RCTScreenSize();

    _touchHandler = [RCTSurfaceTouchHandler new];

    _stage = RCTSurfaceStageSurfaceDidInitialize;

    [_surfacePresenter registerSurface:self];
  }

  return self;
}

- (BOOL)start
{
  if (![self _setStage:RCTSurfaceStageStarted]) {
    return NO;
  }

  [_surfacePresenter startSurface:self];

  return YES;
}

- (BOOL)stop
{
  if (![self _unsetStage:RCTSurfaceStageStarted]) {
    return NO;
  }

  [_surfacePresenter unregisterSurface:self];
  return YES;
}

- (void)dealloc
{
  [self stop];
}

#pragma mark - Immutable Properties (no need to enforce synchronization)

- (NSString *)moduleName
{
  return _moduleName;
}

#pragma mark - Main-Threaded Routines

- (RCTSurfaceView *)view
{
  RCTAssertMainQueue();

  if (!_view) {
    _view = [[RCTSurfaceView alloc] initWithSurface:(RCTSurface *)self];
    [_touchHandler attachToView:_view];
  }

  return _view;
}

#pragma mark - Stage management

- (RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (BOOL)_setStage:(RCTSurfaceStage)stage
{
  return [self _setStage:stage setOrUnset:YES];
}

- (BOOL)_unsetStage:(RCTSurfaceStage)stage
{
  return [self _setStage:stage setOrUnset:NO];
}

- (BOOL)_setStage:(RCTSurfaceStage)stage setOrUnset:(BOOL)setOrUnset
{
  RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (setOrUnset) {
      updatedStage = (RCTSurfaceStage)(_stage | stage);
    } else {
      updatedStage = (RCTSurfaceStage)(_stage & ~stage);
    }

    if (updatedStage == _stage) {
      return NO;
    }

    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
  return YES;
}

- (void)_propagateStageChange:(RCTSurfaceStage)stage
{
  // Updating the `view`
  RCTExecuteOnMainQueue(^{
    self->_view.stage = stage;
  });

  // Notifying the `delegate`
  id<RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeStage:)]) {
    [delegate surface:(RCTSurface *)self didChangeStage:stage];
  }
}

#pragma mark - Properties Management

- (NSDictionary *)properties
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _properties;
}

- (void)setProperties:(NSDictionary *)properties
{
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if ([properties isEqualToDictionary:_properties]) {
      return;
    }

    _properties = [properties copy];
  }

  [_surfacePresenter setProps:properties surface:self];
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  return [_surfacePresenter sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize surface:self];
}

#pragma mark - Size Constraints

- (void)setSize:(CGSize)size
{
  [self setMinimumSize:size maximumSize:size];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(minimumSize, _minimumSize) && CGSizeEqualToSize(maximumSize, _maximumSize)) {
      return;
    }

    _maximumSize = maximumSize;
    _minimumSize = minimumSize;
  }

  [_surfacePresenter setMinimumSize:minimumSize maximumSize:maximumSize surface:self];
}

- (CGSize)minimumSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _minimumSize;
}

- (CGSize)maximumSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _maximumSize;
}

#pragma mark - intrinsicSize

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(intrinsicSize, _intrinsicSize)) {
      return;
    }

    _intrinsicSize = intrinsicSize;
  }

  // Notifying `delegate`
  id<RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeIntrinsicSize:)]) {
    [delegate surface:(RCTSurface *)(id)self didChangeIntrinsicSize:intrinsicSize];
  }
}

- (CGSize)intrinsicSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _intrinsicSize;
}

#pragma mark - Synchronous Waiting

- (BOOL)synchronouslyWaitForStage:(RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  // TODO: Not supported yet.
  return NO;
}

#pragma mark - Deprecated

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  return [self initWithSurfacePresenter:bridge.surfacePresenter
                             moduleName:moduleName
                      initialProperties:initialProperties];
}

- (NSNumber *)rootViewTag
{
  return @(_rootTag);
}

@end
