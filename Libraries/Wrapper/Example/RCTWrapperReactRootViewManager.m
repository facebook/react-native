// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTWrapperReactRootViewManager.h"

#import <RCTWrapper/RCTWrapperView.h>
#import <RCTWrapper/RCTWrapperViewControllerHostingView.h>

#import "RCTWrapperReactRootViewController.h"

@implementation RCTWrapperReactRootViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[RCTWrapperReactRootViewController alloc] initWithBridge:self.bridge];

  RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
