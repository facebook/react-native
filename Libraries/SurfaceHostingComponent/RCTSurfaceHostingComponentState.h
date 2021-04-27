/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurfaceStage.h>

@interface RCTSurfaceHostingComponentState : NSObject

@property (nonatomic, readonly, assign) CGSize intrinsicSize;
@property (nonatomic, readonly, assign) RCTSurfaceStage stage;

+ (instancetype)newWithStage:(RCTSurfaceStage)stage intrinsicSize:(CGSize)intrinsicSize;

@end
