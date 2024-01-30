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

#if !TARGET_OS_OSX // [macOS]
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

#if TARGET_OS_IOS // [visionOS]
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [RCTSharedApplication() statusBarStyle];
}
#endif // [visionOS]

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  _lastViewBounds = CGRectZero;
}

#if TARGET_OS_IOS // [visionOS]
- (BOOL)prefersStatusBarHidden
{
  return [RCTSharedApplication() isStatusBarHidden];
}
#endif // [visionOS]

#if RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
#if !TARGET_OS_VISION // [visionOS]
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:[RCTSharedApplication() keyWindow]];
#else // [visionOS
  UIInterfaceOrientationMask appSupportedOrientationsMask = UIInterfaceOrientationMaskLandscape;
#endif // visonOS]
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
#endif // [macOS]

@end
