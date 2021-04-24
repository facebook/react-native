/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class RCTSurface;

@interface RCTSurfaceBackedComponentState : NSObject

@property (atomic, readonly, strong) RCTSurface *surface;

+ (instancetype)newWithSurface:(RCTSurface *)surface;

@end
