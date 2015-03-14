// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTestModule.h"

@implementation RCTTestModule

- (void)markTestCompleted
{
  RCT_EXPORT();

  _done = YES;
}

@end
