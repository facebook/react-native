// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTInputAccessoryShadowView.h"

#import <React/RCTUtils.h>

@implementation RCTInputAccessoryShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  subview.width = (YGValue) { RCTScreenSize().width, YGUnitPoint };
}

@end
