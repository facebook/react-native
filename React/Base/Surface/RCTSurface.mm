/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSurface.h"
#import "RCTSurfaceView+Internal.h"

#import <mutex>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTShadowView+Layout.h"
#import "RCTSurfaceDelegate.h"
#import "RCTSurfaceRootShadowView.h"
#import "RCTSurfaceRootShadowViewDelegate.h"
#import "RCTSurfaceRootView.h"
#import "RCTSurfaceView.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUIManagerUtils.h"

@interface RCTSurface () <RCTSurfaceRootShadowViewDelegate>
@end

@implementation RCTSurface {
  // Immutable
  RCTBridge *_bridge;
  NSString *_moduleName;
  NSNumber *_rootViewTag;

  // Protected by the `_mutex`
  std::mutex _mutex;
  RCTBridge *_batchedBridge;
  RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;

  // The Main thread only
  RCTSurfaceView *_Nullable _view;
  RCTTouchHandler *_Nullable _touchHandler;

  // Semaphores
  dispatch_semaphore_t _rootShadowViewDidStartRenderingSemaphore;
  dispatch_semaphore_t _rootShadowViewDidStartLayingOutSemaphore;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  RCTAssert(bridge.valid, @"Valid bridge is required to instanciate `RCTSurface`.");

  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootViewTag = RCTAllocateRootViewTag();
    _rootShadowViewDidStartRenderingSemaphore = dispatch_semaphore_create(0);
    _rootShadowViewDidStartLayingOutSemaphore = dispatch_semaphore_create(0);

    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillLoadJavaScriptNotification:)
                                                 name:RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeDidLoadJavaScriptNotification:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    _stage = RCTSurfaceStageSurfaceDidInitialize;

    if (!bridge.loading) {
      _stage = _stage | RCTSurfaceStageBridgeDidLoad;
    }

    [self _registerRootView];
    [self _run];
  }

  return self;
}

- (void)dealloc
{
  [self _stop];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Immutable Properties (no need to enforce synchonization)

- (RCTBridge *)bridge
{
  return _bridge;
}

- (NSString *)moduleName
{
  return _moduleName;
}

- (NSNumber *)rootViewTag
{
  return _rootViewTag;
}

#pragma mark - Convinience Internal Thread-Safe Properties

- (RCTBridge *)_batchedBridge
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _batchedBridge;
}

- (RCTUIManager *)_uiManager
{
  return self._batchedBridge.uiManager;
}

#pragma mark - Main-Threaded Routines

- (RCTSurfaceView *)view
{
  RCTAssertMainQueue();

  if (!_view) {
    _view = [[RCTSurfaceView alloc] initWithSurface:self];

    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:self.bridge];
    [_touchHandler attachToView:_view];

    [self _mountRootViewIfNeeded];
  }

  return _view;
}

- (void)_mountRootViewIfNeeded
{
  RCTAssertMainQueue();

  RCTSurfaceView *view = self->_view;
  if (!view) {
    return;
  }

  RCTSurfaceRootView *rootView =
    (RCTSurfaceRootView *)[self._uiManager viewForReactTag:self->_rootViewTag];
  if (!rootView) {
    return;
  }

  RCTAssert([rootView isKindOfClass:[RCTSurfaceRootView class]],
    @"Received root view is not an instanse of `RCTSurfaceRootView`.");

  if (rootView.superview != view) {
    view.rootView = rootView;
  }
}

#pragma mark - Bridge Events

- (void)handleBridgeWillLoadJavaScriptNotification:(NSNotification *)notification
{
  RCTAssertMainQueue();

  [self _setStage:RCTSurfaceStageBridgeDidLoad];
}

- (void)handleBridgeDidLoadJavaScriptNotification:(NSNotification *)notification
{
  RCTAssertMainQueue();

  [self _setStage:RCTSurfaceStageModuleDidLoad];

  RCTBridge *bridge = notification.userInfo[@"bridge"];

  BOOL isRerunNeeded = NO;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (bridge != _batchedBridge) {
      _batchedBridge = bridge;
      isRerunNeeded = YES;
    }
  }

  if (isRerunNeeded) {
    [self _run];
  }
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
    [delegate surface:self didChangeStage:stage];
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
  RCTBridge *batchedBridge;
  NSDictionary *properties;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    batchedBridge = _batchedBridge;
    properties = _properties;
  }

  if (!batchedBridge.valid) {
    return;
  }

  NSDictionary *applicationParameters =
    @{
      @"rootTag": _rootViewTag,
      @"initialProps": properties,
    };

  RCTLogInfo(@"Running surface %@ (%@)", _moduleName, applicationParameters);

  [batchedBridge enqueueJSCall:@"AppRegistry"
                        method:@"runApplication"
                          args:@[_moduleName, applicationParameters]
                    completion:NULL];

  [self _setStage:RCTSurfaceStageSurfaceDidRun];
}

- (void)_stop
{
  RCTBridge *batchedBridge = self._batchedBridge;
  [batchedBridge enqueueJSCall:@"AppRegistry"
                        method:@"unmountApplicationComponentAtRootTag"
                          args:@[self->_rootViewTag]
                    completion:NULL];
}

- (void)_registerRootView
{
  RCTBridge *batchedBridge;
  CGSize minimumSize;
  CGSize maximumSize;

  {
    std::lock_guard<std::mutex> lock(_mutex);
    batchedBridge = _batchedBridge;
    minimumSize = _minimumSize;
    maximumSize = _maximumSize;
  }

  RCTUIManager *uiManager = batchedBridge.uiManager;

  RCTExecuteOnUIManagerQueue(^{
    [uiManager registerRootViewTag:self->_rootViewTag];

    RCTSurfaceRootShadowView *rootShadowView =
      (RCTSurfaceRootShadowView *)[uiManager shadowViewForReactTag:self->_rootViewTag];
    RCTAssert([rootShadowView isKindOfClass:[RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `RCTSurfaceRootShadowView`.");

    [rootShadowView setMinimumSize:minimumSize
                       maximumSize:maximumSize];
    rootShadowView.delegate = self;
  });
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
{
  RCTUIManager *uiManager = self._uiManager;
  __block CGSize fittingSize;

  RCTUnsafeExecuteOnUIManagerQueueSync(^{
    RCTSurfaceRootShadowView *rootShadowView =
      (RCTSurfaceRootShadowView *)[uiManager shadowViewForReactTag:self->_rootViewTag];

    RCTAssert([rootShadowView isKindOfClass:[RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `RCTSurfaceRootShadowView`.");

    fittingSize = [rootShadowView sizeThatFitsMinimumSize:minimumSize
                                              maximumSize:maximumSize];
  });

  return fittingSize;
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

  RCTUIManager *uiManager = self._uiManager;

  RCTUnsafeExecuteOnUIManagerQueueSync(^{
    RCTSurfaceRootShadowView *rootShadowView =
      (RCTSurfaceRootShadowView *)[uiManager shadowViewForReactTag:self->_rootViewTag];
    RCTAssert([rootShadowView isKindOfClass:[RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `RCTSurfaceRootShadowView`.");

    [rootShadowView setMinimumSize:minimumSize maximumSize:maximumSize];
    [uiManager setNeedsLayout];
  });
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
    [delegate surface:self didChangeIntrinsicSize:intrinsicSize];
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
  if (RCTIsMainQueue() && (stage == RCTSurfaceStageSurfaceDidInitialRendering)) {
    // This case *temporary* does not supported.
    stage = RCTSurfaceStageSurfaceDidInitialLayout;
  }

  if (RCTIsUIManagerQueue()) {
    RCTLogInfo(@"Synchronous waiting is not supported on UIManager queue.");
    return NO;
  }

  dispatch_semaphore_t semaphore;
  switch (stage) {
    case RCTSurfaceStageSurfaceDidInitialLayout:
      semaphore = _rootShadowViewDidStartLayingOutSemaphore;
      break;
    case RCTSurfaceStageSurfaceDidInitialRendering:
      semaphore = _rootShadowViewDidStartRenderingSemaphore;
      break;
    default:
      RCTAssert(NO, @"Only waiting for `RCTSurfaceStageSurfaceDidInitialRendering` and `RCTSurfaceStageSurfaceDidInitialLayout` stages is supported.");
  }

  BOOL timeoutOccurred = dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_SEC));
  if (!timeoutOccurred) {
    // Balancing the semaphore.
    // Note: `dispatch_semaphore_wait` reverts the decrement in case when timeout occurred.
    dispatch_semaphore_signal(semaphore);
  }

  return !timeoutOccurred;
}

#pragma mark - RCTSurfaceRootShadowViewDelegate

- (void)rootShadowView:(RCTRootShadowView *)rootShadowView didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  self.intrinsicSize = intrinsicSize;
}

- (void)rootShadowViewDidStartRendering:(RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:RCTSurfaceStageSurfaceDidInitialRendering];

  dispatch_semaphore_signal(_rootShadowViewDidStartRenderingSemaphore);
}

- (void)rootShadowViewDidStartLayingOut:(RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:RCTSurfaceStageSurfaceDidInitialLayout];

  dispatch_semaphore_signal(_rootShadowViewDidStartLayingOutSemaphore);

  RCTExecuteOnMainQueue(^{
    // Rendering is happening, let's mount `rootView` into `view` if we already didn't do this.
    [self _mountRootViewIfNeeded];
  });
}

@end
