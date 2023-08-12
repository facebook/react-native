/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTDefines.h>

#if RCT_DEV

@interface RCTFPSGraph : RCTPlatformView // [macOS]

@property (nonatomic, assign, readonly) NSUInteger FPS;
@property (nonatomic, assign, readonly) NSUInteger maxFPS;
@property (nonatomic, assign, readonly) NSUInteger minFPS;

- (instancetype)initWithFrame:(CGRect)frame color:(RCTUIColor *)color NS_DESIGNATED_INITIALIZER; // [macOS]

- (void)onTick:(NSTimeInterval)timestamp;

@end

#endif
