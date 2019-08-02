/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <React/RCTBridge.h>
#import <React/RNComponentViewFactory.h>
#import <React/RNPrimitives.h>
#import <React/RNSurfacePresenterStub.h>
#import <react/config/ReactNativeConfig.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class RNFabricSurface;
@class RNMountingManager;

/**
 * Coordinates presenting of React Native Surfaces and represents application
 * facing interface of running React Native core.
 * SurfacePresenter incapsulates a bridge object inside and discourage direct
 * access to it.
 */
@interface RNSurfacePresenter : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge
                        config:(std::shared_ptr<const facebook::react::ReactNativeConfig>)config;

@property (nonatomic, readonly) RNComponentViewFactory *componentViewFactory;
@property (nonatomic, readonly) facebook::react::ContextContainer::Shared contextContainer;

@end

@interface RNSurfacePresenter (Surface) <RNSurfacePresenterStub>

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(RNFabricSurface *)surface;
/**
 * Starting initiates running, rendering and mounting processes.
 * Should be called after registerSurface and any other surface-specific setup is done
 */
- (void)startSurface:(RNFabricSurface *)surface;
- (void)unregisterSurface:(RNFabricSurface *)surface;
- (void)setProps:(NSDictionary *)props surface:(RNFabricSurface *)surface;

- (nullable RNFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(RNFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(RNFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props;

- (void)addObserver:(id<RNSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<RNSurfacePresenterObserver>)observer;

@end

NS_ASSUME_NONNULL_END
