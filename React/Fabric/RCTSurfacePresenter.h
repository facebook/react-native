/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <React/RCTBridge.h>
#import <React/RCTComponentViewFactory.h>
#import <react/uimanager/ContextContainer.h>
#import <React/RCTPrimitives.h>
#import <react/config/ReactNativeConfig.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTMountingManager;

/**
 * Coordinates presenting of React Native Surfaces and represents application
 * facing interface of running React Native core.
 * SurfacePresenter incapsulates a bridge object inside and discourage direct
 * access to it.
 */
@interface RCTSurfacePresenter : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge
                        config:(std::shared_ptr<const facebook::react::ReactNativeConfig>)config;

@property (nonatomic, readonly) RCTComponentViewFactory *componentViewFactory;
@property (nonatomic, readonly) facebook::react::SharedContextContainer contextContainer;

@end

@interface RCTSurfacePresenter (Surface)

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(RCTFabricSurface *)surface;
/**
 * Starting initiates running, rendering and mounting processes.
 * Should be called after registerSurface and any other surface-specific setup is done
 */
- (void)startSurface:(RCTFabricSurface *)surface;
- (void)unregisterSurface:(RCTFabricSurface *)surface;
- (void)setProps:(NSDictionary *)props
         surface:(RCTFabricSurface *)surface;

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
- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(RCTFabricSurface *)surface;

@end

@interface RCTSurfacePresenter (Deprecated)

/**
 * Returns a underlying bridge.
 */
- (RCTBridge *)bridge_DO_NOT_USE;

@end

@interface RCTBridge (Deprecated)

@property (nonatomic) RCTSurfacePresenter *surfacePresenter;

@end

NS_ASSUME_NONNULL_END
