/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModalHostViewController.h"

@implementation RCTModalHostViewController
{
  CGRect _lastViewFrame;
#if !TARGET_OS_TV
  UIStatusBarStyle _preferredStatusBarStyle;
#endif
  BOOL _preferredStatusBarHidden;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }

#if !TARGET_OS_TV
  _preferredStatusBarStyle = [[UIApplication sharedApplication] statusBarStyle];
  _preferredStatusBarHidden = [[UIApplication sharedApplication] isStatusBarHidden];
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

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  // Picking some defaults here, we should probably make this configurable
  if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
    return UIInterfaceOrientationMaskAll;
  } else {
    return UIInterfaceOrientationMaskPortrait;
  }
}

#if !TARGET_OS_TV
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return _preferredStatusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
  return _preferredStatusBarHidden;
}
#endif

@end
