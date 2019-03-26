// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

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
