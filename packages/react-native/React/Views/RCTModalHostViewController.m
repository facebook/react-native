/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if !TARGET_OS_OSX // [macOS]
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

#if TARGET_OS_IOS // [visionOS]
  _preferredStatusBarStyle = [RCTSharedApplication() statusBarStyle];
  _preferredStatusBarHidden = [RCTSharedApplication() isStatusBarHidden];
#endif // [visionOS]

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

#if TARGET_OS_IOS // [visionOS]
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return _preferredStatusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
  return _preferredStatusBarHidden;
}
#endif // [visionOS]

#if RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
#if !TARGET_OS_VISION // [visionOS]
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:[RCTSharedApplication() keyWindow]];
#else // [visionOS
  UIInterfaceOrientationMask appSupportedOrientationsMask = UIInterfaceOrientationMaskAll;
#endif // visionOS]
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
#endif // [macOS]
