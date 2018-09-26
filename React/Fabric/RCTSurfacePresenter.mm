/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

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
#import <fabric/core/LayoutContext.h>
#import <fabric/core/LayoutConstraints.h>
#import <fabric/imagemanager/ImageManager.h>
#import <fabric/uimanager/ContextContainer.h>

#import "MainRunLoopEventBeat.h"
#import "MessageQueueEventBeat.h"
#import "RCTConversions.h"

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
@end

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  RCTScheduler *_Nullable _scheduler;
  RCTMountingManager *_mountingManager;
  RCTBridge *_bridge;
  RCTBridge *_batchedBridge;
  RCTSurfaceRegistry *_surfaceRegistry;
  SharedContextContainer _contextContainer;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    auto contextContainer = std::make_shared<ContextContainer>();

    auto messageQueueThread = _batchedBridge.jsMessageThread;

    EventBeatFactory synchronousBeatFactory = [messageQueueThread]() {
      return std::make_unique<MainRunLoopEventBeat>(messageQueueThread);
    };

    EventBeatFactory asynchronousBeatFactory = [messageQueueThread]() {
      return std::make_unique<MessageQueueEventBeat>(messageQueueThread);
    };

    contextContainer->registerInstance<EventBeatFactory>(synchronousBeatFactory, "synchronous");
    contextContainer->registerInstance<EventBeatFactory>(asynchronousBeatFactory, "asynchronous");

    void *imageLoader = (__bridge void *)[[RCTBridge currentBridge] imageLoader];
    contextContainer->registerInstance(std::make_shared<ImageManager>(imageLoader));

    _contextContainer = contextContainer;

    _surfaceRegistry = [[RCTSurfaceRegistry alloc] init];

    _mountingManager = [[RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

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

- (void)createSchedulerIfNeeded
{
  if (_scheduler) {
    return;
  }

  _scheduler = [[RCTScheduler alloc] initWithContextContainer:_contextContainer];
  _scheduler.delegate = self;
}

- (void)ensureSchedulerDoesExist
{
  RCTAssert(_scheduler, @"RCTSurfacePresenter: RCTScheduler instance must be already instantiated at this point.");
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];

  [self startSurface:surface];
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  [self stopSurface:surface];

  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props
         surface:(RCTFabricSurface *)surface
{
  // This implementation is suboptimal indeed but still better than nothing for now.
  [self stopSurface:surface];
  [self startSurface:surface];
}

- (RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(RCTFabricSurface *)surface
{
  [self ensureSchedulerDoesExist];

  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = RCTSizeFromCGSize(maximumSize);

  return [_scheduler measureWithLayoutConstraints:layoutConstraints
                                    layoutContext:layoutContext
                                          rootTag:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(RCTFabricSurface *)surface
{
  [self ensureSchedulerDoesExist];

  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = RCTSizeFromCGSize(maximumSize);

  [_scheduler constraintLayoutWithLayoutConstraints:layoutConstraints
                                      layoutContext:layoutContext
                                            rootTag:surface.rootTag];
}

- (void)startSurface:(RCTFabricSurface *)surface
{
  [_mountingManager.componentViewRegistry dequeueComponentViewWithName:@"Root" tag:surface.rootTag];

  [self createSchedulerIfNeeded];
  [_scheduler registerRootTag:surface.rootTag];

  [self setMinimumSize:surface.minimumSize
           maximumSize:surface.maximumSize
               surface:surface];

  // TODO: Move this down to Scheduler.
  NSDictionary *applicationParameters = @{
    @"rootTag": @(surface.rootTag),
    @"initialProps": surface.properties,
  };
  [self->_batchedBridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[surface.moduleName, applicationParameters] completion:NULL];
}

- (void)stopSurface:(RCTFabricSurface *)surface
{
  // TODO: Move this down to Scheduler.
  [_batchedBridge enqueueJSCall:@"ReactFabric" method:@"unmountComponentAtNode" args:@[@(surface.rootTag)] completion:NULL];

  [self ensureSchedulerDoesExist];
  [_scheduler unregisterRootTag:surface.rootTag];

  UIView<RCTComponentViewProtocol> *rootView = [_mountingManager.componentViewRegistry componentViewByTag:surface.rootTag];
  [_mountingManager.componentViewRegistry enqueueComponentViewWithName:@"Root" tag:surface.rootTag componentView:rootView];

  [surface _unsetStage:(RCTSurfaceStagePrepared | RCTSurfaceStageMounted)];
}

- (void)startAllSurfaces
{
  for (RCTFabricSurface *surface in _surfaceRegistry.enumerator) {
    [self startSurface:surface];
  }
}

- (void)stopAllSurfaces
{
  for (RCTFabricSurface *surface in _surfaceRegistry.enumerator) {
    [self stopSurface:surface];
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

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName
{
  [_mountingManager preliminaryCreateComponentViewWithName:componentName];
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
  [self stopAllSurfaces];
  _scheduler = nil;
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _batchedBridge) {
    _batchedBridge = bridge;

    [self startAllSurfaces];
  }
}

@end

@implementation RCTSurfacePresenter (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler.uiManager_DO_NOT_USE;
}

- (RCTBridge *)bridge_DO_NOT_USE
{
  return _bridge;
}

- (void)setUiManagerInstaller:(std::function<facebook::react::UIManagerInstaller>)uiManagerInstaller
{
  _contextContainer->registerInstance(uiManagerInstaller, "uimanager-installer");
}

- (std::function<facebook::react::UIManagerInstaller>)uiManagerInstaller
{
  return _contextContainer->getInstance<std::function<facebook::react::UIManagerInstaller>>("uimanager-installer");
}

- (void)setUiManagerUninstaller:(std::function<facebook::react::UIManagerUninstaller>)uiManagerUninstaller
{
  _contextContainer->registerInstance(uiManagerUninstaller, "uimanager-uninstaller");
}

- (std::function<facebook::react::UIManagerUninstaller>)uiManagerUninstaller
{
  return _contextContainer->getInstance<std::function<facebook::react::UIManagerUninstaller>>("uimanager-uninstaller");
}

@end

@implementation RCTBridge (RCTSurfacePresenter)

- (RCTSurfacePresenter *)surfacePresenter
{
  return [self jsBoundExtraModuleForClass:[RCTSurfacePresenter class]];
}

@end
