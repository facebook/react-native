/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDebuggingOverlay.h"

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

@implementation TraceUpdateTuple

- (instancetype)initWithView:(RCTPlatformView *)view cleanupBlock:(dispatch_block_t)cleanupBlock // [macOS]
{
  if (self = [super init]) {
    _view = view;
    _cleanupBlock = cleanupBlock;
  }

  return self;
}

@end

@implementation RCTDebuggingOverlay {
  NSMutableArray<RCTPlatformView *> *_highlightedElements; // [macOS]
  NSMutableDictionary<NSNumber *, TraceUpdateTuple *> *_idToTraceUpdateMap;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    _idToTraceUpdateMap = [NSMutableDictionary new];
  }
  return self;
}

- (void)highlightTraceUpdates:(NSArray *)updates
{
  for (NSDictionary *update in updates) {
    NSNumber *identifier = [RCTConvert NSNumber:update[@"id"]];
    NSDictionary *nodeRectangle = update[@"rectangle"];
    RCTUIColor *nodeColor = [RCTConvert RCTUIColor:update[@"color"]]; // [macOS]

    CGRect rect = [RCTConvert CGRect:nodeRectangle];

    TraceUpdateTuple *possiblyRegisteredTraceUpdateTuple = [_idToTraceUpdateMap objectForKey:identifier];
    if (possiblyRegisteredTraceUpdateTuple != nil) {
      dispatch_block_t cleanupBlock = [possiblyRegisteredTraceUpdateTuple cleanupBlock];
      RCTPlatformView *view = [possiblyRegisteredTraceUpdateTuple view]; // [macOS]

      dispatch_block_cancel(cleanupBlock);

      view.frame = rect;
      view.layer.borderColor = nodeColor.CGColor;

      dispatch_block_t newCleanupBlock = dispatch_block_create(0, ^{
        [self->_idToTraceUpdateMap removeObjectForKey:identifier];
        [view removeFromSuperview];
      });

      [_idToTraceUpdateMap setObject:[[TraceUpdateTuple alloc] initWithView:view cleanupBlock:newCleanupBlock]
                              forKey:identifier];

      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), dispatch_get_main_queue(), newCleanupBlock);

      continue;
    }

    RCTUIView *box = [[RCTUIView alloc] initWithFrame:rect];
    box.backgroundColor = [RCTUIColor clearColor]; // [macOS]

    box.layer.borderWidth = 2.0f;
    box.layer.borderColor = nodeColor.CGColor;

    dispatch_block_t unmountViewAndPerformCleanup = dispatch_block_create(0, ^{
      [self->_idToTraceUpdateMap removeObjectForKey:identifier];
      [box removeFromSuperview];
    });

    TraceUpdateTuple *traceUpdateTuple = [[TraceUpdateTuple alloc] initWithView:box
                                                                   cleanupBlock:unmountViewAndPerformCleanup];

    [_idToTraceUpdateMap setObject:traceUpdateTuple forKey:identifier];
    [self addSubview:box];

    dispatch_after(
        dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), dispatch_get_main_queue(), unmountViewAndPerformCleanup);
  }
}

- (void)highlightElements:(NSArray *)rectangles
{
  if (_highlightedElements == nil) {
    _highlightedElements = [NSMutableArray new];
  }

  for (NSDictionary *rectangle in rectangles) {
    RCTUIView *view = [[RCTUIView alloc] initWithFrame:[RCTConvert CGRect:rectangle]]; // [macOS]
    view.backgroundColor = [RCTUIColor colorWithRed:200 / 255.0 green:230 / 255.0 blue:255 / 255.0 alpha:0.8]; // [macOS]
    [self addSubview:view];
    [_highlightedElements addObject:view];
  }
}

- (void)clearElementsHighlights
{
  if (_highlightedElements != nil) {
    for (RCTPlatformView *v in _highlightedElements) { // [macOS]
      [v removeFromSuperview];
    }
  }

  _highlightedElements = nil;
}

@end
