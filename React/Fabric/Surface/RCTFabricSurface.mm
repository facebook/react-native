/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurface.h"

#import <React/RCTSurfaceView+Internal.h>

#import <mutex>
#import <stdatomic.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTSurfaceDelegate.h>
#import <React/RCTSurfaceRootView.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUtils.h>

#import "RCTSurfacePresenter.h"
#import "RCTMountingManager.h"

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
  RCTTouchHandler *_Nullable _touchHandler;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  RCTAssert(bridge.valid, @"Valid bridge is required to instanciate `RCTSurface`.");

  self = [self initWithSurfacePresenter:bridge.surfacePresenter
                             moduleName:moduleName
                      initialProperties:initialProperties];

  return self;
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
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    _stage = RCTSurfaceStageSurfaceDidInitialize;

    [self _run];
  }

  return self;
}

- (void)dealloc
{
  [self _stop];
}

#pragma mark - Immutable Properties (no need to enforce synchonization)

- (NSString *)moduleName
{
  return _moduleName;
}

- (NSNumber *)rootViewTag
{
  return @(_rootTag);
}

#pragma mark - Main-Threaded Routines

- (RCTSurfaceView *)view
{
  RCTAssertMainQueue();

  if (!_view) {
    _view = [[RCTSurfaceView alloc] initWithSurface:(RCTSurface *)self];
  }

  return _view;
}

#pragma mark - Stage management

- (RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (void)_setStage:(RCTSurfaceStage)stage
{
  RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (_stage & stage) {
      return;
    }

    updatedStage = (RCTSurfaceStage)(_stage | stage);
    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
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

  [self _run];
}

#pragma mark - Running

- (void)_run
{
  [_surfacePresenter registerSurface:self];
  [self _setStage:RCTSurfaceStageSurfaceDidRun];
}

- (void)_stop
{
  [_surfacePresenter unregisterSurface:self];
  [self _setStage:RCTSurfaceStageSurfaceDidStop];
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
{
  return [_surfacePresenter sizeThatFitsMinimumSize:minimumSize
                                        maximumSize:maximumSize
                                            surface:self];
}

#pragma mark - Size Constraints

- (void)setSize:(CGSize)size
{
  [self setMinimumSize:size maximumSize:size];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(minimumSize, _minimumSize) &&
        CGSizeEqualToSize(maximumSize, _maximumSize)) {
      return;
    }

    _maximumSize = maximumSize;
    _minimumSize = minimumSize;
  }

  return [_surfacePresenter setMinimumSize:minimumSize
                               maximumSize:maximumSize
                                   surface:self];
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

@end
