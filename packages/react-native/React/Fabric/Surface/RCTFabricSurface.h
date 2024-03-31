/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSurfaceProtocol.h>
#import <react/renderer/scheduler/SurfaceHandler.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;
@class RCTSurfaceView;
@class RCTSurfacePresenter;

/**
 * (This is Fabric-compatible RCTSurface implementation.)
 *
 * RCTSurface instance represents React Native-powered piece of a user interface
 * which can be a full-screen app, separate modal view controller,
 * or even small widget.
 * It is called "Surface".
 *
 * The RCTSurface instance is completely thread-safe by design;
 * it can be created on any thread, and any its method can be called from
 * any thread (if the opposite is not mentioned explicitly).
 *
 * The primary goals of the RCTSurface are:
 *  * ability to measure and layout the surface in a thread-safe
 *    and synchronous manner;
 *  * ability to create a UIView instance on demand (later);
 *  * ability to communicate the current stage of the surface granularly.
 */
@interface RCTFabricSurface : NSObject <RCTSurfaceProtocol>

/**
 * Initializes a new RCTFabricSurface instance.
 *
 * @param surfacePresenter The surface presenter responsible for managing this surface.
 * @param moduleName The name of the module associated with this surface.
 * @param initialProperties The initial properties to set for this surface.
 * @return An initialized RCTFabricSurface instance.
 */
- (instancetype)initWithSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties;

/**
 * EXPERIMENTAL
 * Resets the surface to its initial stage.
 *
 * @param surfacePresenter The surface presenter to use for the reset.
 */
- (void)resetWithSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter;

/**
 * Creates (if needed) and returns a UIView instance which represents the Surface.
 * The Surface will cache and *retain* this object.
 * Returning the UIView instance does not mean that the Surface is ready
 * to execute and layout. It can be just a handler which Surface will use later
 * to mount the actual views.
 * RCTSurface does not control (or influence in any way) the size or origin
 * of this view. Some superview (or another owner) must use other methods
 * of this class to set up proper layout and interop interactions with UIKit
 * or another UI framework.
 *
 * @return The UIView instance representing the Surface.
 */
- (RCTSurfaceView *)view;

/**
 * Sets the size constraints for the Surface.
 *
 * @param minimumSize The minimum size constraint.
 * @param maximumSize The maximum size constraint.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

/**
 * Measures the Surface with given constraints.
 *
 * @param minimumSize The minimum size constraint.
 * @param maximumSize The maximum size constraint.
 * @return The size that fits within the given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

/**
 * Synchronously blocks the current thread up to the given timeout until
 * the Surface is rendered.
 *
 * @param timeout The maximum time interval to wait for rendering.
 * @return YES if rendering completed within the timeout, otherwise NO.
 */
- (BOOL)synchronouslyWaitFor:(NSTimeInterval)timeout;

@end

@interface RCTFabricSurface (Internal)

/**
 * Retrieves the SurfaceHandler associated with this Surface.
 *
 * @return The SurfaceHandler instance.
 */
- (const facebook::react::SurfaceHandler &)surfaceHandler;

@end

@interface RCTFabricSurface (Deprecated)

/**
 * Deprecated. Use `initWithSurfacePresenter:moduleName:initialProperties` instead.
 */
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

@end

NS_ASSUME_NONNULL_END
