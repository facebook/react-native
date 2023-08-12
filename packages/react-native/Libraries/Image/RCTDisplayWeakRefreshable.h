/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#import <React/RCTPlatformDisplayLink.h> // [macOS]

@protocol RCTDisplayRefreshable

- (void)displayDidRefresh:(RCTPlatformDisplayLink *)displayLink; // [macOS]

@end

@interface RCTDisplayWeakRefreshable : NSObject

@property (nonatomic, weak) id<RCTDisplayRefreshable> refreshable;

+ (RCTPlatformDisplayLink *)displayLinkWithWeakRefreshable:(id<RCTDisplayRefreshable>)refreshable; // [macOS]

@end
