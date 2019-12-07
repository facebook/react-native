/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <mutex>

#import <React/RCTAssert.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTFollyConvert.h>
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

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  std::mutex _schedulerMutex;
  RCTScheduler
      *_Nullable _scheduler; // Thread-safe. Mutation of the instance variable is protected by `_schedulerMutex`.
  ContextContainer::Shared _contextContainer;
  RuntimeExecutor _runtimeExecutor;
  RCTMountingManager *_mountingManager; // Thread-safe.
  RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.
  better::shared_mutex _observerListMutex;
  NSMutableArray<id<RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithContextContainer:(ContextContainer::Shared)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");

    _runtimeExecutor = runtimeExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [[RCTSurfaceRegistry alloc] init];
    _mountingManager = [[RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    _observers = [NSMutableArray array];

    _scheduler = [self _createScheduler];
  }

  return self;
}

- (RCTComponentViewFactory *)componentViewFactory
{
  return _mountingManager.componentViewRegistry.componentViewFactory;
}

- (ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  return _contextContainer;
}

- (void)setContextContainer:(ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  _contextContainer = contextContainer;
}

- (void)setRuntimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  _runtimeExecutor = runtimeExecutor;
}

- (RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  return _runtimeExecutor;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  [_surfaceRegistry registerSurface:surface];
  if (_scheduler) {
    [self _startSurface:surface];
  }
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  if (_scheduler) {
    [self _stopSurface:surface];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props surface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
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
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};
  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(maximumSize)};
  return [_scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                           layoutContext:layoutContext
                                               surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  LayoutContext layoutContext = {.pointScaleFactor = RCTScreenScale()};
  LayoutConstraints layoutConstraints = {.minimumSize = RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = RCTSizeFromCGSize(maximumSize)};
  [_scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                             layoutContext:layoutContext
                                                 surfaceId:surface.rootTag];
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  ReactTag tag = [reactTag integerValue];
  UIView<RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  if (componentView == nil) {
    return NO; // This view probably isn't managed by Fabric
  }
  ComponentHandle handle = [[componentView class] componentDescriptorProvider].handle;
  auto *componentDescriptor = [_scheduler findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:handle];

  if (!componentDescriptor) {
    return YES;
  }

  [_mountingManager synchronouslyUpdateViewOnUIThread:tag changedProps:props componentDescriptor:*componentDescriptor];
  return YES;
}

- (BOOL)suspend
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (!_scheduler) {
    return NO;
  }

  [self _stopAllSurfaces];
  _scheduler = nil;

  return YES;
}

- (BOOL)resume
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (_scheduler) {
    return NO;
  }

  _scheduler = [self _createScheduler];
  [self _startAllSurfaces];

  return YES;
}

#pragma mark - Private

- (RCTScheduler *)_createScheduler
{
  auto componentRegistryFactory = [factory = wrapManagedObject(self.componentViewFactory)](
                                      EventDispatcher::Weak const &eventDispatcher,
                                      ContextContainer::Shared const &contextContainer) {
    return [(RCTComponentViewFactory *)unwrapManagedObject(factory)
        createComponentDescriptorRegistryWithParameters:{eventDispatcher, contextContainer}];
  };

  auto runtimeExecutor = _runtimeExecutor;

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = _contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;
  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.synchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    return std::make_unique<MainRunLoopEventBeat>(ownerBox, runtimeExecutor);
  };

  toolbox.asynchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    return std::make_unique<RuntimeEventBeat>(ownerBox, runtimeExecutor);
  };

  RCTScheduler *scheduler = [[RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
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

  [_scheduler startSurfaceWithSurfaceId:surface.rootTag
                             moduleName:surface.moduleName
                           initialProps:surface.properties
                      layoutConstraints:layoutConstraints
                          layoutContext:layoutContext];
}

- (void)_stopSurface:(RCTFabricSurface *)surface
{
  [_scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  RCTMountingManager *mountingManager = _mountingManager;
  RCTExecuteOnMainQueue(^{
    RCTComponentViewDescriptor rootViewDescriptor =
        [mountingManager.componentViewRegistry componentViewDescriptorWithTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                           componentViewDescriptor:rootViewDescriptor];
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

- (void)schedulerDidFinishTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args
{
  ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
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
      auto rootComponentViewDescriptor =
          [_mountingManager.componentViewRegistry componentViewDescriptorWithTag:rootTag];
      surface.view.rootView = (RCTSurfaceRootView *)rootComponentViewDescriptor.view;
    }
  }

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }
}

@end
