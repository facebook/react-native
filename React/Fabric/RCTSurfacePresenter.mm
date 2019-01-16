/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <objc/runtime.h>
#import <mutex>
#import <jsi/jsi.h>
#import <cxxreact/MessageQueueThread.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTImageLoader.h>
#import <React/RCTMountingManager.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfaceRegistry.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTUtils.h>
#import <react/core/LayoutContext.h>
#import <react/core/LayoutConstraints.h>
#import <react/components/root/RootShadowNode.h>
#import <react/imagemanager/ImageManager.h>
#import <react/uimanager/ContextContainer.h>

#import "MainRunLoopEventBeat.h"
#import "RuntimeEventBeat.h"
#import "RCTConversions.h"

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
@end

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  std::mutex _schedulerMutex;
  std::mutex _contextContainerMutex;
  RCTScheduler *_Nullable _scheduler; // Thread-safe. Mutation of the instance variable is protected by `_schedulerMutex`.
  RCTMountingManager *_mountingManager; // Thread-safe.
  RCTSurfaceRegistry *_surfaceRegistry;  // Thread-safe.
  RCTBridge *_bridge; // Unsafe. We are moving away from Bridge.
  RCTBridge *_batchedBridge;
  std::shared_ptr<const ReactNativeConfig> _reactNativeConfig;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge config:(std::shared_ptr<const ReactNativeConfig>)config
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    _surfaceRegistry = [[RCTSurfaceRegistry alloc] init];

    _mountingManager = [[RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    if (config != nullptr) {
      _reactNativeConfig = config;
    } else {
      _reactNativeConfig = std::make_shared<const EmptyReactNativeConfig>();
    }

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillReloadNotification:)
                                                 name:RCTBridgeWillReloadNotification
                                               object:_bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptDidLoadNotification:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:_bridge];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (RCTComponentViewFactory *)componentViewFactory
{
  return _mountingManager.componentViewRegistry.componentViewFactory;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
}

- (void)startSurface:(RCTFabricSurface *)surface
{
  [self _startSurface:surface];
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  [self _stopSurface:surface];
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props
         surface:(RCTFabricSurface *)surface
{
  // This implementation is suboptimal indeed but still better than nothing for now.
  [self _stopSurface:surface];
  [self _startSurface:surface];
}

- (RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(RCTFabricSurface *)surface
{
  LayoutContext layoutContext = {
    .pointScaleFactor = RCTScreenScale()
  };

  LayoutConstraints layoutConstraints = {
    .minimumSize = RCTSizeFromCGSize(minimumSize),
    .maximumSize = RCTSizeFromCGSize(maximumSize)
  };

  return [self._scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                                layoutContext:layoutContext
                                                    surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(RCTFabricSurface *)surface
{
  LayoutContext layoutContext = {
    .pointScaleFactor = RCTScreenScale()
  };

  LayoutConstraints layoutConstraints = {
    .minimumSize = RCTSizeFromCGSize(minimumSize),
    .maximumSize = RCTSizeFromCGSize(maximumSize)
  };

  [self._scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                                  layoutContext:layoutContext
                                                      surfaceId:surface.rootTag];
}

#pragma mark - Private

- (RCTScheduler *)_scheduler
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (_scheduler) {
    return _scheduler;
  }

  _scheduler = [[RCTScheduler alloc] initWithContextContainer:self.contextContainer];
  _scheduler.delegate = self;

  return _scheduler;
}

@synthesize contextContainer = _contextContainer;

- (SharedContextContainer)contextContainer
{
  std::lock_guard<std::mutex> lock(_contextContainerMutex);

  if (_contextContainer) {
    return _contextContainer;
  }

  _contextContainer = std::make_shared<ContextContainer>();

  _contextContainer->registerInstance(_reactNativeConfig, "ReactNativeConfig");

  auto messageQueueThread = _batchedBridge.jsMessageThread;
  auto runtime = (facebook::jsi::Runtime *)((RCTCxxBridge *)_batchedBridge).runtime;

  RuntimeExecutor runtimeExecutor =
    [runtime, messageQueueThread](std::function<void(facebook::jsi::Runtime &runtime)> &&callback) {
      messageQueueThread->runOnQueue([runtime, callback = std::move(callback)]() {
        callback(*runtime);
      });
    };

  EventBeatFactory synchronousBeatFactory = [runtimeExecutor]() {
    return std::make_unique<MainRunLoopEventBeat>(runtimeExecutor);
  };

  EventBeatFactory asynchronousBeatFactory = [runtimeExecutor]() {
    return std::make_unique<RuntimeEventBeat>(runtimeExecutor);
  };

  _contextContainer->registerInstance<EventBeatFactory>(synchronousBeatFactory, "synchronous");
  _contextContainer->registerInstance<EventBeatFactory>(asynchronousBeatFactory, "asynchronous");

  _contextContainer->registerInstance(runtimeExecutor, "runtime-executor");

  _contextContainer->registerInstance(std::make_shared<ImageManager>((__bridge void *)[_bridge imageLoader]), "ImageManager");
  return _contextContainer;
}

- (void)_startSurface:(RCTFabricSurface *)surface
{
  [_mountingManager.componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                              tag:surface.rootTag];

  LayoutContext layoutContext = {
    .pointScaleFactor = RCTScreenScale()
  };

  LayoutConstraints layoutConstraints = {
    .minimumSize = RCTSizeFromCGSize(surface.minimumSize),
    .maximumSize = RCTSizeFromCGSize(surface.maximumSize)
  };

  [self._scheduler startSurfaceWithSurfaceId:surface.rootTag
                                  moduleName:surface.moduleName
                                initailProps:surface.properties
                           layoutConstraints:layoutConstraints
                               layoutContext:layoutContext];
}

- (void)_stopSurface:(RCTFabricSurface *)surface
{
  [self._scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  UIView<RCTComponentViewProtocol> *rootView =
    [_mountingManager.componentViewRegistry componentViewByTag:surface.rootTag];
  [_mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                              tag:surface.rootTag
                                                                    componentView:rootView];

  [surface _unsetStage:(RCTSurfaceStagePrepared | RCTSurfaceStageMounted)];
}

- (void)_startAllSurfaces
{
  for (RCTFabricSurface *surface in _surfaceRegistry.enumerator) {
    [self _startSurface:surface];
  }
}

- (void)_stopAllSurfaces
{
  for (RCTFabricSurface *surface in _surfaceRegistry.enumerator) {
    [self _stopSurface:surface];
  }
}

#pragma mark - RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::react::ShadowViewMutationList)mutations
                                        rootTag:(ReactTag)rootTag
{
  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];

  [surface _setStage:RCTSurfaceStagePrepared];

  [_mountingManager performTransactionWithMutations:mutations
                                            rootTag:rootTag];
}

- (void)schedulerOptimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  [_mountingManager optimisticallyCreateComponentViewWithComponentHandle:componentHandle];
}

#pragma mark - RCTMountingManagerDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  // Does nothing.
}

- (void)mountingManager:(RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];
  RCTSurfaceStage stage = surface.stage;
  if (stage & RCTSurfaceStagePrepared) {
    // We have to progress the stage only if the preparing phase is done.
    if ([surface _setStage:RCTSurfaceStageMounted]) {
      UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];
      surface.view.rootView = (RCTSurfaceRootView *)rootComponentView;
    }
  }
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  {
    std::lock_guard<std::mutex> lock(_schedulerMutex);
    if (!_scheduler) {
      // Seems we are already in the realoding process.
      return;
    }
  }

  [self _stopAllSurfaces];

  {
    std::lock_guard<std::mutex> lock(_schedulerMutex);
    _scheduler = nil;
    _contextContainer = nil;
  }
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _batchedBridge) {
    _batchedBridge = bridge;

    [self _startAllSurfaces];
  }
}

@end

@implementation RCTSurfacePresenter (Deprecated)

- (RCTBridge *)bridge_DO_NOT_USE
{
  return _bridge;
}

@end

@implementation RCTBridge (Deprecated)

- (void)setSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter
{
  objc_setAssociatedObject(self, @selector(surfacePresenter), surfacePresenter, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (RCTSurfacePresenter *)surfacePresenter
{
  return objc_getAssociatedObject(self, @selector(surfacePresenter));
}

@end
