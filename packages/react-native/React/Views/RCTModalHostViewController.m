/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewController.h"

#import "RCTLog.h"
#import "RCTModalHostView.h"

@implementation RCTModalHostViewController {
  CGRect _lastViewFrame;
  UIStatusBarStyle _preferredStatusBarStyle;
  BOOL _preferredStatusBarHidden;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }

  self.modalInPresentation = YES;
#if !TARGET_OS_VISION
  _preferredStatusBarStyle = [RCTUIStatusBarManager() statusBarStyle];
  _preferredStatusBarHidden = [RCTUIStatusBarManager() isStatusBarHidden];
#endif
    
  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (self.boundsDidChangeBlock && !CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    self.boundsDidChangeBlock(self.view.bounds);
    _lastViewFrame = self.view.frame;
  }
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return _preferredStatusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
  return _preferredStatusBarHidden;
}

#if RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
#if !TARGET_OS_VISION
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:[RCTSharedApplication() keyWindow]];
#else
    UIInterfaceOrientationMask appSupportedOrientationsMask = UIInterfaceOrientationMaskPortrait;
#endif
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
