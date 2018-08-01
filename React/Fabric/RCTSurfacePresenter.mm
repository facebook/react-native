/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTMountingManager.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfaceRegistry.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTUtils.h>
#import <fabric/core/LayoutContext.h>
#import <fabric/core/LayoutConstraints.h>

#import "RCTConversions.h"

using namespace facebook::react;

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  RCTScheduler *_scheduler;
  RCTMountingManager *_mountingManager;
  RCTBridge *_bridge;
  RCTBridge *_batchedBridge;
  RCTSurfaceRegistry *_surfaceRegistry;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    _scheduler = [[RCTScheduler alloc] init];
    _scheduler.delegate = self;

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

#pragma mark - RCTSchedulerDelegate

- (void)schedulerDidComputeMutationInstructions:(facebook::react::TreeMutationInstructionList)instructions
                                        rootTag:(ReactTag)rootTag
{
  [_mountingManager mutateComponentViewTreeWithMutationInstructions:instructions
                                                            rootTag:rootTag];
}

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName
{
  [_mountingManager preliminaryCreateComponentViewWithName:componentName];
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  [_scheduler registerRootTag:surface.rootTag];
  [self runSurface:surface];

  // FIXME: Mutation instruction MUST produce instruction for root node.
  [_mountingManager.componentViewRegistry dequeueComponentViewWithName:@"Root" tag:surface.rootTag];
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  [self stopSurface:surface];
  [_scheduler unregisterRootTag:surface.rootTag];
  [_surfaceRegistry unregisterSurface:surface];
}

- (RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(RCTFabricSurface *)surface
{
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
  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = RCTSizeFromCGSize(maximumSize);

  [_scheduler constraintLayoutWithLayoutConstraints:layoutConstraints
                                      layoutContext:layoutContext
                                            rootTag:surface.rootTag];
}

- (void)runSurface:(RCTFabricSurface *)surface
{
  NSDictionary *applicationParameters = @{
    @"rootTag": @(surface.rootTag),
    @"initialProps": surface.properties,
  };

  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[surface.moduleName, applicationParameters] completion:NULL];
}

- (void)stopSurface:(RCTFabricSurface *)surface
{
  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"unmountApplicationComponentAtRootTag" args:@[@(surface.rootTag)] completion:NULL];
}

#pragma mark - RCTMountingManagerDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTIsMainQueue();
  // TODO: Propagate state change to Surface.
}

- (void)mountingManager:(RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTIsMainQueue();
  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];

  // FIXME: Implement proper state propagation mechanism.
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialRendering];
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialLayout];
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialMounting];

  UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];

  surface.view.rootView = (RCTSurfaceRootView *)rootComponentView;
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  // TODO: Define a lifecycle contract for the pieces involved here including the scheduler, mounting manager, and
  // the surface registry. For now simply recreate the scheduler on reload.
  // The goal is to deallocate the Scheduler and its underlying references before the JS runtime is destroyed.
  _scheduler = [[RCTScheduler alloc] init];
  _scheduler.delegate = self;
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _batchedBridge) {
    _batchedBridge = bridge;
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

@end

@implementation RCTBridge (RCTSurfacePresenter)

- (RCTSurfacePresenter *)surfacePresenter
{
  return [self jsBoundExtraModuleForClass:[RCTSurfacePresenter class]];
}

@end
