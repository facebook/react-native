/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingComponentState.h"

@implementation RCTSurfaceHostingComponentState

+ (instancetype)newWithStage:(RCTSurfaceStage)stage intrinsicSize:(CGSize)intrinsicSize
{
  return [[self alloc] initWithStage:stage intrinsicSize:intrinsicSize];
}

- (instancetype)initWithStage:(RCTSurfaceStage)stage intrinsicSize:(CGSize)intrinsicSize
{
  if (self = [super init]) {
    _stage = stage;
    _intrinsicSize = intrinsicSize;
  }

  return self;
}

- (BOOL)isEqual:(RCTSurfaceHostingComponentState *)other
{
  if (other == self) {
    return YES;
  }

  return _stage == other->_stage && CGSizeEqualToSize(_intrinsicSize, other->_intrinsicSize);
}

@end
