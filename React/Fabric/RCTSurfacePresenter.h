/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>
#import <React/RCTSurfacePresenterStub.h>
<<<<<<< HEAD
#import <react/config/ReactNativeConfig.h>
=======

#import <React/RCTComponentViewFactory.h>
>>>>>>> fb/0.62-stable
#import <react/utils/ContextContainer.h>
#import <react/utils/RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTImageLoader;
@class RCTMountingManager;

/**
 * Coordinates presenting of React Native Surfaces and represents application
 * facing interface of running React Native core.
 */
@interface RCTSurfacePresenter : NSObject

<<<<<<< HEAD
- (instancetype)initWithBridge:(RCTBridge *)bridge
                        config:(std::shared_ptr<const facebook::react::ReactNativeConfig>)config
                   imageLoader:(RCTImageLoader *)imageLoader
               runtimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor;
=======
- (instancetype)initWithContextContainer:(facebook::react::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor;
>>>>>>> fb/0.62-stable

@property (nonatomic, readonly) RCTComponentViewFactory *componentViewFactory;

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

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(RCTFabricSurface *)surface;
- (void)unregisterSurface:(RCTFabricSurface *)surface;
<<<<<<< HEAD
=======

>>>>>>> fb/0.62-stable
- (void)setProps:(NSDictionary *)props surface:(RCTFabricSurface *)surface;

- (nullable RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RCTFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props;

- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer;

@end

NS_ASSUME_NONNULL_END
