/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricModalHostViewController.h"

#import <React/RCTLog.h>
#import <React/RCTSurfaceTouchHandler.h>

@implementation RCTFabricModalHostViewController {
  CGRect _lastViewBounds;
  RCTSurfaceTouchHandler *_touchHandler;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }
  _touchHandler = [RCTSurfaceTouchHandler new];

  self.modalInPresentation = YES;

  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  if (!CGRectEqualToRect(_lastViewBounds, self.view.bounds)) {
    [_delegate boundsDidChange:self.view.bounds];
    _lastViewBounds = self.view.bounds;
  }
}

- (void)loadView
{
  [super loadView];
  [_touchHandler attachToView:self.view];
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [RCTUIStatusBarManager() statusBarStyle];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  _lastViewBounds = CGRectZero;
}

- (BOOL)prefersStatusBarHidden
{
  return [RCTUIStatusBarManager() isStatusBarHidden];
}

#if RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:[RCTSharedApplication() keyWindow]];
  if (!(_supportedInterfaceOrientations & appSupportedOrientationsMask)) {
    RCTLogError(
        @"Modal was presented with 0x%x orientations mask but the application only supports 0x%x."
        @"Add more interface orientations to your app's Info.plist to fix this."
        @"NOTE: This will crash in non-dev mode.",
        (unsigned)_supportedInterfaceOrientations,
        (unsigned)appSupportedOrientationsMask);
    return UIInterfaceOrientationMaskAll;
  }

  return _supportedInterfaceOrientations;
}
#endif // RCT_DEV

@end
