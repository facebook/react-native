// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTWrapperViewManager.h"

#import "RCTWrapperShadowView.h"
#import "RCTWrapperView.h"

@implementation RCTWrapperViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [[RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
