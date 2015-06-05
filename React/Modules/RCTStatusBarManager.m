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

@implementation RCTConvert (UIStatusBar)

RCT_ENUM_CONVERTER(UIStatusBarStyle, (@{
  @"default": @(UIStatusBarStyleDefault),
  @"light-content": @(UIStatusBarStyleLightContent),
}), UIStatusBarStyleDefault, integerValue);

RCT_ENUM_CONVERTER(UIStatusBarAnimation, (@{
  @"none": @(UIStatusBarAnimationNone),
  @"fade": @(UIStatusBarAnimationFade),
  @"slide": @(UIStatusBarAnimationSlide),
}), UIStatusBarAnimationNone, integerValue);

@end

@implementation RCTStatusBarManager

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value = [[[NSBundle mainBundle] objectForInfoDictionaryKey:
              @"UIViewControllerBasedStatusBarAppearance"] ?: @YES boolValue];
  });

  return value;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)statusBarStyle
                  animated:(BOOL)animated)
{
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
    [[UIApplication sharedApplication] setStatusBarStyle:statusBarStyle
                                                animated:animated];
  }
}

RCT_EXPORT_METHOD(setHidden:(BOOL)hidden
                  withAnimation:(UIStatusBarAnimation)animation)
{
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
    [[UIApplication sharedApplication] setStatusBarHidden:hidden
                                            withAnimation:animation];
  }
}

@end
