/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTSurfaceProtocol;

/**
 * UIView instance which represents the Surface
 */
@interface RCTSurfaceView : UIView

- (instancetype)initWithSurface:(id<RCTSurfaceProtocol>)surface NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, readonly, nullable) id<RCTSurfaceProtocol> surface;

@end

NS_ASSUME_NONNULL_END
