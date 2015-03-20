// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTRootView.h"

#import "UIView+ReactKit.h"

@implementation RCTRootView

- (id)initWithCoder:(NSCoder *)aDecoder
{
  if ((self = [super initWithCoder:aDecoder])) {
    [self setUp];
  }
  return self;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self setUp];
  }
  return self;
}

- (void)setUp
{
  // Every root view that is created must have a unique react tag.
  // Numbering of these tags goes from 1, 11, 21, 31, etc
  static NSInteger rootViewTag = 1;
  self.reactTag = @(rootViewTag);
  rootViewTag += 10;
}

- (BOOL)isReactRootView
{
  return YES;
}

@end
