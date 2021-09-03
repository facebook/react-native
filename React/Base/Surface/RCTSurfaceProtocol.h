/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSurfaceStage.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTSurfaceView;
@protocol RCTSurfaceDelegate;

@protocol RCTSurfaceProtocol <NSObject>

@property (atomic, readonly) RCTSurfaceStage stage;
@property (atomic, readonly) NSString *moduleName;
@property (atomic, readwrite, weak, nullable) id<RCTSurfaceDelegate> delegate;

/**
 * Deprecated. Use `rootTag` instead.
 */
@property (atomic, readonly) NSNumber *rootViewTag;
@property (atomic, copy, readwrite) NSDictionary *properties;
@property (atomic, readonly) NSInteger rootTag;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

/**
 * Sets `minimumSize`, `maximumSize`, and `viewportOffset`  layout constraints for the Surface.
 * `viewportOffset` is ignored in `RCTSurface` but used in `RCTFabricSurface`.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize viewportOffset:(CGPoint)viewportOffset;

#pragma mark - Dealing with UIView representation, the Main thread only access

/**
 * Creates (if needed) and returns `UIView` instance which represents the Surface.
 * The Surface will cache and *retain* this object.
 * Returning the UIView instance does not mean that the Surface is ready
 * to execute and layout. It can be just a handler which Surface will use later
 * to mount the actual views.
 * RCTSurface does not control (or influence in any way) the size or origin
 * of this view. Some superview (or another owner) must use other methods
 * of this class to setup proper layout and interop interactions with UIKit
 * or another UI framework.
 * This method must be called only from the main queue.
 */
- (RCTSurfaceView *)view;

#pragma mark - Layout: Measuring

/**
 * Measures the Surface with given constraints.
 * This method does not cause any side effects on the surface object.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

/**
 * Return the current size of the root view based on (but not clamp by) current
 * size constraints.
 */
@property (atomic, assign, readonly) CGSize intrinsicSize;

#pragma mark - Start & Stop

/**
 * Starts or stops the Surface.
 * Those methods are a no-op for regular RCTSurface (for now), but all call sites must call them appropriately.
 */
- (BOOL)start;
- (BOOL)stop;

@end

NS_ASSUME_NONNULL_END
