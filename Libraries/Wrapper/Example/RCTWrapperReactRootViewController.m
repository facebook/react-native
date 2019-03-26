// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "RCTWrapperReactRootViewController.h"

#import <RCTWrapper/RCTWrapper.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

#import "RCTWrapperExampleView.h"

@implementation RCTWrapperReactRootViewController {
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  RCTRootView *rootView =
    [[RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
