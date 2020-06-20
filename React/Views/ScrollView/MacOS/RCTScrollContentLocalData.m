/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentLocalData.h"

@implementation RCTScrollContentLocalData

- (instancetype)initWithVerticalScroller:(NSScroller *)verticalScroller
                      horizontalScroller:(NSScroller *)horizontalScroller
{
  if (self = [super init]) {
    _verticalScrollerWidth = NSWidth([verticalScroller frame]);
    _horizontalScrollerHeight = NSHeight([horizontalScroller frame]);
  }
  return self;
}

@end
