/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDisplayWeakRefreshable.h"

@implementation RCTDisplayWeakRefreshable

+ (RCTPlatformDisplayLink *)displayLinkWithWeakRefreshable:(id<RCTDisplayRefreshable>)refreshable { // TODO(macOS GH#774)
  RCTDisplayWeakRefreshable *target = [[RCTDisplayWeakRefreshable alloc] initWithRefreshable:refreshable];
  return [RCTPlatformDisplayLink displayLinkWithTarget:target selector:@selector(displayDidRefresh:)]; // TODO(macOS GH#774)
}

- (instancetype)initWithRefreshable:(id<RCTDisplayRefreshable>)refreshable
{
  if (self = [super init]) {
    _refreshable = refreshable;
  }
  return self;
}

- (void)displayDidRefresh:(RCTPlatformDisplayLink *)displayLink { // TODO(macOS GH#774)
  [_refreshable displayDidRefresh:displayLink];
}

@end
