/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTView.h>

@interface TraceUpdateTuple : NSObject

@property (nonatomic, strong, readonly) UIView *view;
@property (nonatomic, copy, readonly) dispatch_block_t cleanupBlock;

- (instancetype)initWithView:(UIView *)view cleanupBlock:(dispatch_block_t)cleanupBlock;

@end

@interface RCTDebuggingOverlay : RCTView

- (void)highlightTraceUpdates:(NSArray *)updates;
- (void)highlightElements:(NSArray *)rectangles;
- (void)clearElementsHighlights;

@end
