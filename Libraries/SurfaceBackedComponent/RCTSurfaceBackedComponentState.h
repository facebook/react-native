/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol RCTSurfaceProtocol;

@interface RCTSurfaceBackedComponentState : NSObject

@property (atomic, readonly, strong) id<RCTSurfaceProtocol> surface;

+ (instancetype)newWithSurface:(id<RCTSurfaceProtocol>)surface;

@end
