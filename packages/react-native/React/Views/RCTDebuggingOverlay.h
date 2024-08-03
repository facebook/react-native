/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTView.h>

@interface TraceUpdateTuple : NSObject

@property (nonatomic, strong, readonly) RCTPlatformView *view; // [macOS]
@property (nonatomic, copy, readonly) dispatch_block_t cleanupBlock;

- (instancetype)initWithView:(RCTPlatformView *)view cleanupBlock:(dispatch_block_t)cleanupBlock; // [macOS]

@end

@interface RCTDebuggingOverlay : RCTView

- (void)highlightTraceUpdates:(NSArray *)updates;
- (void)highlightElements:(NSArray *)rectangles;
- (void)clearElementsHighlights;

@end
