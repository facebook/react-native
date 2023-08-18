/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDisplayWeakRefreshable.h"

@implementation RCTDisplayWeakRefreshable

+ (CADisplayLink *)displayLinkWithWeakRefreshable:(id<RCTDisplayRefreshable>)refreshable
{
  RCTDisplayWeakRefreshable *target = [[RCTDisplayWeakRefreshable alloc] initWithRefreshable:refreshable];
  return [CADisplayLink displayLinkWithTarget:target selector:@selector(displayDidRefresh:)];
}

- (instancetype)initWithRefreshable:(id<RCTDisplayRefreshable>)refreshable
{
  if (self = [super init]) {
    _refreshable = refreshable;
  }
  return self;
}

- (void)displayDidRefresh:(CADisplayLink *)displayLink
{
  [_refreshable displayDidRefresh:displayLink];
}

@end
