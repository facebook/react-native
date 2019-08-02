/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSurfacePresenter.h"

#import <cxxreact/MessageQueueThread.h>
#import <jsi/jsi.h>
#import <objc/runtime.h>
#import <mutex>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTImageLoader.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUtils.h>
#import <React/RNComponentViewFactory.h>
#import <React/RNComponentViewRegistry.h>
#import <React/RNFabricSurface.h>
#import <React/RNMountingManager.h>
#import <React/RNMountingManagerDelegate.h>
#import <React/RNScheduler.h>
#import <React/RNSurfaceRegistry.h>

#import <react/components/root/RootShadowNode.h>
#import <react/core/LayoutConstraints.h>
#import <react/core/LayoutContext.h>
#import <react/uimanager/ComponentDescriptorFactory.h>
#import <react/uimanager/SchedulerToolbox.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/RuntimeExecutor.h>

#import "MainRunLoopEventBeat.h"
#import "RNConversions.h"
#import "RuntimeEventBeat.h"

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

@interface RNSurfacePresenter () <RNSchedulerDelegate, RNMountingManagerDelegate>
@end

@implementation RNSurfacePresenter {
  std::mutex _schedulerMutex;
  std::mutex _contextContainerMutex;
  RNScheduler
      *_Nullable _scheduler; // Thread-safe. Mutation of the instance variable is protected by `_schedulerMutex`.
  RNMountingManager *_mountingManager; // Thread-safe.
  RNSurfaceRegistry *_surfaceRegistry; // Thread-safe.
  RCTBridge *_bridge; // Unsafe. We are moving away from Bridge.
  RCTBridge *_batchedBridge;
  std::shared_ptr<const ReactNativeConfig> _reactNativeConfig;
  better::shared_mutex _observerListMutex;
  NSMutableArray<id<RNSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge config:(std::shared_ptr<const ReactNativeConfig>)config
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;
    [_batchedBridge setSurfacePresenter:self];

    _surfaceRegistry = [[RNSurfaceRegistry alloc] init];

    _mountingManager = [[RNMountingManager alloc] init];
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

- (RNComponentViewFactory *)componentViewFactory
{
  return _mountingManager.componentViewRegistry.componentViewFactory;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RNFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
}

- (void)startSurface:(RNFabricSurface *)surface
{
  [self _startSurface:surface];
}

- (void)unregisterSurface:(RNFabricSurface *)surface
{
  [self _stopSurface:surface];
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props surface:(RNFabricSurface *)surface
{
  // This implementation is suboptimal indeed but still better than nothing for now.
  [self _stopSurface:surface];
  [self _startSurface:surface];
}

- (RNFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RNFabricSurface *)surface
{
  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};

  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(maximumSize)};

  return [self._scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                                layoutContext:layoutContext
                                                    surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RNFabricSurface *)surface
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
  UIView<RNComponentViewProtocol> *componentView = [_mountingManager.componentViewRegistry componentViewByTag:tag];
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

- (RNScheduler *)_scheduler
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (_scheduler) {
    return _scheduler;
  }

  auto componentRegistryFactory = [factory = wrapManagedObject(self.componentViewFactory)](
                                      EventDispatcher::Shared const &eventDispatcher,
                                      ContextContainer::Shared const &contextContainer) {
    return [(RNComponentViewFactory *)unwrapManagedObject(factory)
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

  _scheduler = [[RNScheduler alloc] initWithToolbox:toolbox];
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
  _contextContainer->insert("RCTImageLoader", wrapManagedObject([_bridge moduleForClass:[RCTImageLoader class]]));

  return _contextContainer;
}

- (void)_startSurface:(RNFabricSurface *)surface
{
  RNMountingManager *mountingManager = _mountingManager;
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

- (void)_stopSurface:(RNFabricSurface *)surface
{
  [self._scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  RNMountingManager *mountingManager = _mountingManager;
  RCTExecuteOnMainQueue(^{
    UIView<RNComponentViewProtocol> *rootView =
        [mountingManager.componentViewRegistry componentViewByTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                                     componentView:rootView];
  });

  [surface _unsetStage:(RCTSurfaceStagePrepared | RCTSurfaceStageMounted)];
}

- (void)_startAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RNFabricSurface *> *enumerator) {
    for (RNFabricSurface *surface in enumerator) {
      [self _startSurface:surface];
    }
  }];
}

- (void)_stopAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RNFabricSurface *> *enumerator) {
    for (RNFabricSurface *surface in enumerator) {
      [self _stopSurface:surface];
    }
  }];
}

#pragma mark - RNSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::react::MountingCoordinator::Shared const &)mountingCoordinator
{
  RNFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(facebook::react::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args
{
  ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)addObserver:(id<RNSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<RNSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - RNMountingManagerDelegate

- (void)mountingManager:(RNMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<RNSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(RNMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  RNFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];
  RCTSurfaceStage stage = surface.stage;
  if (stage & RCTSurfaceStagePrepared) {
    // We have to progress the stage only if the preparing phase is done.
    if ([surface _setStage:RCTSurfaceStageMounted]) {
      UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];
      surface.view.rootView = (RCTSurfaceRootView *)rootComponentView;
    }
  }

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<RNSurfacePresenterObserver> observer in _observers) {
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
