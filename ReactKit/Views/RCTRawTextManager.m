// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTRawTextManager.h"

#import "RCTShadowRawText.h"

@implementation RCTRawTextManager

- (UIView *)viewWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
{
  return [[UIView alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowRawText alloc] init];
}

@end

