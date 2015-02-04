// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTViewManager.h"

#import "RCTView.h"

@implementation RCTViewManager

- (UIView *)view
{
  return [[RCTView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(pointerEvents)

@end
