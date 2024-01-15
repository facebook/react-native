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

@implementation RCTDebuggingOverlay {
  NSMutableArray<UIView *> *_highlightedElements;
  NSMutableArray<UIView *> *_highlightedTraceUpdates;
}

- (void)draw:(NSString *)serializedNodes
{
  [self clearTraceUpdatesViews];

  NSError *error = nil;
  id deserializedNodes = RCTJSONParse(serializedNodes, &error);

  if (error) {
    RCTLogError(@"Failed to parse serialized nodes passed to RCTDebuggingOverlay");
    return;
  }

  if (![deserializedNodes isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Expected to receive nodes as an array, got %@", NSStringFromClass([deserializedNodes class]));
    return;
  }

  _highlightedTraceUpdates = [NSMutableArray new];
  for (NSDictionary *node in deserializedNodes) {
    NSDictionary *nodeRectangle = node[@"rect"];
    NSNumber *nodeColor = node[@"color"];

    CGRect rect = [RCTConvert CGRect:nodeRectangle];

    UIView *box = [[UIView alloc] initWithFrame:rect];
    box.backgroundColor = [UIColor clearColor];

    box.layer.borderWidth = 2.0f;
    box.layer.borderColor = [RCTConvert UIColor:nodeColor].CGColor;

    [self addSubview:box];
    [_highlightedTraceUpdates addObject:box];
  }
}

- (void)clearTraceUpdatesViews
{
  if (_highlightedTraceUpdates != nil) {
    for (UIView *v in _highlightedTraceUpdates) {
      [v removeFromSuperview];
    }
  }

  _highlightedTraceUpdates = nil;
}

- (void)highlightElements:(NSString *)serializedElements
{
  NSError *error = nil;
  id deserializedRectangles = RCTJSONParse(serializedElements, &error);

  if (error) {
    RCTLogError(@"Failed to parse serialized elements passed to RCTDebuggingOverlay");
    return;
  }

  if (![deserializedRectangles isKindOfClass:[NSArray class]]) {
    RCTLogError(
        @"Expected to receive rectangles as an array, got %@", NSStringFromClass([deserializedRectangles class]));
    return;
  }

  if (_highlightedElements == nil) {
    _highlightedElements = [NSMutableArray new];
  }

  for (NSDictionary *rectangle in deserializedRectangles) {
    UIView *view = [[UIView alloc] initWithFrame:[RCTConvert CGRect:rectangle]];
    view.backgroundColor = [UIColor colorWithRed:200 / 255.0 green:230 / 255.0 blue:255 / 255.0 alpha:0.8];

    [self addSubview:view];
    [_highlightedElements addObject:view];
  }
}

- (void)clearElementsHighlights
{
  if (_highlightedElements != nil) {
    for (UIView *v in _highlightedElements) {
      [v removeFromSuperview];
    }
  }

  _highlightedElements = nil;
}

@end
