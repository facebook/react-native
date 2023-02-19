/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#if TARGET_OS_OSX
#import "RCTScrollContentLocalData.h"

@implementation RCTScrollContentLocalData

- (instancetype)initWithVerticalScrollerWidth:(CGFloat)verticalScrollerWidth
										 horizontalScrollerHeight:(CGFloat)horizontalScrollerHeight;
{
  if (self = [super init]) {
    _verticalScrollerWidth = verticalScrollerWidth;
    _horizontalScrollerHeight = horizontalScrollerHeight;
  }
  return self;
}

@end
#endif