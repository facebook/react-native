/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStatusBarManager.h"

#import "RCTLog.h"

@implementation RCTStatusBarManager

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"] ?: @YES boolValue];
  });

  return value;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)statusBarStyle
                  animated:(BOOL)animated)
{
  dispatch_async(dispatch_get_main_queue(), ^{

    if (RCTViewControllerBasedStatusBarAppearance()) {
      RCTLogError(@"RCTStatusBarManager module requires that the \
                  UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
    } else {
      [[UIApplication sharedApplication] setStatusBarStyle:statusBarStyle
                                                  animated:animated];
    }
  });
}

RCT_EXPORT_METHOD(setHidden:(BOOL)hidden
                  withAnimation:(UIStatusBarAnimation)animation)
{
  dispatch_async(dispatch_get_main_queue(), ^{

    if (RCTViewControllerBasedStatusBarAppearance()) {
      RCTLogError(@"RCTStatusBarManager module requires that the \
                  UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
    } else {
      [[UIApplication sharedApplication] setStatusBarHidden:hidden
                                              withAnimation:animation];
    }
  });
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"Style": @{
      @"default": @(UIStatusBarStyleDefault),
      @"lightContent": @(UIStatusBarStyleLightContent),
    },
    @"Animation": @{
      @"none": @(UIStatusBarAnimationNone),
      @"fade": @(UIStatusBarAnimationFade),
      @"slide": @(UIStatusBarAnimationSlide),
    },
  };
}

@end
