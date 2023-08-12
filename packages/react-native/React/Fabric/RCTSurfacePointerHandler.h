/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

NS_ASSUME_NONNULL_BEGIN

@interface RCTSurfacePointerHandler : UIGestureRecognizer

/*
 * Attaches (and detaches) a view to the touch handler.
 * The receiver does not retain the provided view.
 */
- (void)attachToView:(RCTUIView *)view; // [macOS]
- (void)detachFromView:(RCTUIView *)view; // [macOS]

/*
 * Offset of the attached view relative to the root component in points.
 */
@property (nonatomic, assign) CGPoint viewOriginOffset;

@end

NS_ASSUME_NONNULL_END
