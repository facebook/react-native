/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPlatformDisplayLink.h" // [macOS]

#import "RCTFrameUpdate.h"

#import "RCTUtils.h"

@implementation RCTFrameUpdate

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithDisplayLink:(RCTPlatformDisplayLink *)displayLink // [macOS]
{
  if ((self = [super init])) {
    _timestamp = displayLink.timestamp;
    _deltaTime = displayLink.duration;
  }
  return self;
}

@end
