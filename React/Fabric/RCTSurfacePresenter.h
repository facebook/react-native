/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceStage.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <react/renderer/scheduler/SurfaceHandler.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTImageLoader;
@class RCTMountingManager;
@class RCTScheduler;

/**
 * Coordinates presenting of React Native Surfaces and represents application
 * facing interface of running React Native core.
 */
@interface RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(facebook::react::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor;

@property (nonatomic) facebook::react::ContextContainer::Shared contextContainer;
@property (nonatomic) facebook::react::RuntimeExecutor runtimeExecutor;

/*
 * Suspends/resumes all surfaces associated with the presenter.
 * Suspending is a process or gracefull stopping all surfaces and destroying all underlying infrastructure
 * with a future possibility of recreating the infrastructure and restarting the surfaces from scratch.
 * Suspending is usually a part of a bundle reloading process.
 * Can be called on any thread.
 */
- (BOOL)suspend;
- (BOOL)resume;

@end

@interface RCTSurfacePresenter (Surface) <RCTSurfacePresenterStub>

/*
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(RCTFabricSurface *)surface;
- (void)unregisterSurface:(RCTFabricSurface *)surface;

@property (readonly) RCTMountingManager *mountingManager;
@property (readonly, nullable) RCTScheduler *scheduler;

/*
 * Allow callers to initialize a new fabric surface without adding Fabric as a Buck dependency.
 */
- (id<RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties;

- (nullable RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props;

- (void)setupAnimationDriverWithSurfaceHandler:(facebook::react::SurfaceHandler const &)surfaceHandler;

/*
 * Deprecated.
 * Use `RCTMountingTransactionObserverCoordinator` instead.
 */
- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
