/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTSurface;

@protocol RCTSurfaceDelegate <NSObject>

@optional

/**
 * Notifies a receiver that a surface transitioned to a new stage.
 * See `RCTSurfaceStage` for more details.
 */
- (void)surface:(RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage;

/**
 * Notifies a receiver that root view got a new (intrinsic) size during the last
 * layout pass.
 */
- (void)surface:(RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize;

@end

NS_ASSUME_NONNULL_END
