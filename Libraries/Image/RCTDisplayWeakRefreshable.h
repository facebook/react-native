/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTPlatformDisplayLink.h> // TODO(macOS ISS#2323203)

@protocol RCTDisplayRefreshable

- (void)displayDidRefresh:(RCTPlatformDisplayLink *)displayLink; // TODO(macOS ISS#2323203)

@end

@interface RCTDisplayWeakRefreshable : NSObject

@property (nonatomic, weak) id<RCTDisplayRefreshable> refreshable;

+ (RCTPlatformDisplayLink *)displayLinkWithWeakRefreshable:(id<RCTDisplayRefreshable>)refreshable; // TODO(macOS ISS#2323203)

@end
