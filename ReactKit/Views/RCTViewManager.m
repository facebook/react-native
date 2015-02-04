// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTViewManager.h"

#import "RCTView.h"

@implementation RCTViewManager

- (UIView *)viewWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  return [[RCTView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel)
RCT_EXPORT_VIEW_PROPERTY(pointerEvents)

@end
