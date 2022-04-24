/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceBackedComponentState.h"

#import <React/RCTSurface.h>

@implementation RCTSurfaceBackedComponentState

+ (instancetype)newWithSurface:(RCTSurface *)surface
{
  return [[self alloc] initWithSurface:surface];
}

- (instancetype)initWithSurface:(RCTSurface *)surface
{
  if (self = [super init]) {
    _surface = surface;
  }

  return self;
}

@end
