/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <cxxreact/MessageQueueThread.h>
#import <jsi/jsi.h>
#import <objc/runtime.h>
#import <mutex>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTImageLoader.h>
#import <React/RCTMountingManager.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfaceRegistry.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUtils.h>

#import <react/components/root/RootShadowNode.h>
#import <react/core/LayoutConstraints.h>
#import <react/core/LayoutContext.h>
#import <react/uimanager/ComponentDescriptorFactory.h>
#import <react/uimanager/SchedulerToolbox.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "MainRunLoopEventBeat.h"
#import "RCTConversions.h"
#import "RuntimeEventBeat.h"

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  std::mutex _schedulerMutex;
  std::mutex _contextContainerMutex;
  RCTScheduler
      *_Nullable _scheduler; // Thread-safe. Mutation of the instance variable is protected by `_schedulerMutex`.
  RCTMountingManager *_mountingManager; // Thread-safe.
  RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.
  RCTBridge *_bridge; // Unsafe. We are moving away from Bridge.
  RCTBridge *_batchedBridge;
  std::shared_ptr<const ReactNativeConfig> _reactNativeConfig;
  better::shared_mutex _observerListMutex;
  NSMutableArray<id<RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge config:(std::shared_ptr<const ReactNativeConfig>)config
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;
    [_batchedBridge setSurfacePresenter:self];

    _surfaceRegistry = [[RCTSurfaceRegistry alloc] init];

    _mountingManager = [[RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    if (config != nullptr) {
      _reactNativeConfig = config;
    } else {
      _reactNativeConfig = std::make_shared<const EmptyReactNativeConfig>();
    }

    _observers = [NSMutableArray array];

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

- (void)setProps:(NSDictionary *)props surface:(RCTFabricSurface *)surface
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
  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};

  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(maximumSize)};

  return [self._scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                                layoutContext:layoutContext
                                                    surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RCTFabricSurface *)surface
{
  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};

  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(maximumSize)};

  [self._scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                                  layoutContext:layoutContext
                                                      surfaceId:surface.rootTag];
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props
{
  ReactTag tag = [reactTag integerValue];
  UIView<RCTComponentViewProtocol> *componentView = [_mountingManager.componentViewRegistry componentViewByTag:tag];
  if (componentView == nil) {
    return NO; // This view probably isn't managed by Fabric
  }
  ComponentHandle handle = [[componentView class] componentDescriptorProvider].handle;
  const facebook::react::ComponentDescriptor &componentDescriptor = [self._scheduler getComponentDescriptor:handle];
  [self->_mountingManager synchronouslyUpdateViewOnUIThread:tag
                                               changedProps:props
                                        componentDescriptor:componentDescriptor];
  return YES;
}

#pragma mark - Private

- (RCTScheduler *)_scheduler
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (_scheduler) {
    return _scheduler;
  }

  auto componentRegistryFactory = [factory = wrapManagedObject(self.componentViewFactory)](
                                      EventDispatcher::Shared const &eventDispatcher,
                                      ContextContainer::Shared const &contextContainer) {
    return [(RCTComponentViewFactory *)unwrapManagedObject(factory)
        createComponentDescriptorRegistryWithParameters:{eventDispatcher, contextContainer}];
  };

  auto runtimeExecutor = [self _runtimeExecutor];

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = self.contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;
  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.synchronousEventBeatFactory = [runtimeExecutor]() {
    return std::make_unique<MainRunLoopEventBeat>(runtimeExecutor);
  };

  toolbox.asynchronousEventBeatFactory = [runtimeExecutor]() {
    return std::make_unique<RuntimeEventBeat>(runtimeExecutor);
  };

  _scheduler = [[RCTScheduler alloc] initWithToolbox:toolbox];
  _scheduler.delegate = self;

  return _scheduler;
}

@synthesize contextContainer = _contextContainer;

- (RuntimeExecutor)_runtimeExecutor
{
  auto messageQueueThread = _batchedBridge.jsMessageThread;
  if (messageQueueThread) {
    // Make sure initializeBridge completed
    messageQueueThread->runOnQueueSync([] {});
  }

  auto runtime = (facebook::jsi::Runtime *)((RCTCxxBridge *)_batchedBridge).runtime;

  RuntimeExecutor runtimeExecutor = [self, runtime](std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
    // For now, ask the bridge to queue the callback asynchronously to ensure that
    // it's not invoked too early, e.g. before the bridge is fully ready.
    // Revisit this after Fabric/TurboModule is fully rolled out.
    [((RCTCxxBridge *)_batchedBridge) invokeAsync:[runtime, callback = std::move(callback)]() { callback(*runtime); }];
  };

  return runtimeExecutor;
}

- (ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_contextContainerMutex);

  if (_contextContainer) {
    return _contextContainer;
  }

  _contextContainer = std::make_shared<ContextContainer>();
  // Please do not add stuff here; `SurfacePresenter` must not alter `ContextContainer`.
  // Those two pieces eventually should be moved out there:
  // * `RCTImageLoader` should be moved to `RNImageComponentView`.
  // * `ReactNativeConfig` should be set by outside product code.
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _contextContainer->insert("RCTImageLoader", wrapManagedObject([_bridge imageLoader]));

  return _contextContainer;
}

- (void)_startSurface:(RCTFabricSurface *)surface
{
  RCTMountingManager *mountingManager = _mountingManager;
  RCTExecuteOnMainQueue(^{
    [mountingManager.componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag];
  });

  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};

  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(surface.minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(surface.maximumSize)};

  [self._scheduler startSurfaceWithSurfaceId:surface.rootTag
                                  moduleName:surface.moduleName
                                initialProps:surface.properties
                           layoutConstraints:layoutConstraints
                               layoutContext:layoutContext];
}

- (void)_stopSurface:(RCTFabricSurface *)surface
{
  [self._scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  RCTMountingManager *mountingManager = _mountingManager;
  RCTExecuteOnMainQueue(^{
    UIView<RCTComponentViewProtocol> *rootView =
        [mountingManager.componentViewRegistry componentViewByTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                                     componentView:rootView];
  });

  [surface _unsetStage:(RCTSurfaceStagePrepared | RCTSurfaceStageMounted)];
}

- (void)_startAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RCTFabricSurface *> *enumerator) {
    for (RCTFabricSurface *surface in enumerator) {
      [self _startSurface:surface];
    }
  }];
}

- (void)_stopAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RCTFabricSurface *> *enumerator) {
    for (RCTFabricSurface *surface in enumerator) {
      [self _stopSurface:surface];
    }
  }];
}

#pragma mark - RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::react::MountingCoordinator::Shared const &)mountingCoordinator
{
  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - RCTMountingManagerDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
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

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
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

@implementation RCTBridge (Deprecated)

- (void)setSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter
{
  objc_setAssociatedObject(self, @selector(surfacePresenter), surfacePresenter, OBJC_ASSOCIATION_ASSIGN);
}

- (RCTSurfacePresenter *)surfacePresenter
{
  return objc_getAssociatedObject(self, @selector(surfacePresenter));
}

@end
