/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTDefines.h>

#if RCT_DEV

@interface RCTFPSGraph : RCTPlatformView // TODO(macOS GH#774)

@property (nonatomic, assign, readonly) NSUInteger FPS;
@property (nonatomic, assign, readonly) NSUInteger maxFPS;
@property (nonatomic, assign, readonly) NSUInteger minFPS;

- (instancetype)initWithFrame:(CGRect)frame color:(RCTUIColor *)color NS_DESIGNATED_INITIALIZER; // TODO(macOS GH#774)

- (void)onTick:(NSTimeInterval)timestamp;

@end

#endif
