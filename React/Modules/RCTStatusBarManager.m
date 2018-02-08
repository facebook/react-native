/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStatusBarManager.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#if !TARGET_OS_TV
@implementation RCTConvert (UIStatusBar)

RCT_ENUM_CONVERTER(UIStatusBarStyle, (@{
  @"default": @(UIStatusBarStyleDefault),
  @"light-content": @(UIStatusBarStyleLightContent),
  @"dark-content": @(UIStatusBarStyleDefault),
}), UIStatusBarStyleDefault, integerValue);

RCT_ENUM_CONVERTER(UIStatusBarAnimation, (@{
  @"none": @(UIStatusBarAnimationNone),
  @"fade": @(UIStatusBarAnimationFade),
  @"slide": @(UIStatusBarAnimationSlide),
}), UIStatusBarAnimationNone, integerValue);

@end
#endif

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

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"statusBarFrameDidChange"];
}

#if !TARGET_OS_TV

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self selector:@selector(applicationDidChangeStatusBarFrame) name:UIApplicationDidChangeStatusBarFrameNotification object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

static NSDictionary *RCTExportedFrame()
{
  // The In-Call Status Bar pushes the root view down instead of increasing the size of the StatusBar area
  // that needs to be accounted for in JS. We can fix that by subtracting the y value of the root view
  // from the StatusBar's height.
  CGRect rootFrame = RCTPresentedViewController().view.frame;
  CGRect statusBarFrame = RCTSharedApplication().statusBarFrame;
  return @{
           @"top": @(rootFrame.origin.y),
           @"height": @(statusBarFrame.size.height - rootFrame.origin.y),
           };
}

- (void)applicationDidChangeStatusBarFrame
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self sendEventWithName:@"statusBarFrameDidChange" body:RCTExportedFrame()];
  });
}

RCT_EXPORT_METHOD(getCurrentFrame:(RCTPromiseResolveBlock)resolve rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(RCTExportedFrame());
}

RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)statusBarStyle
                  animated:(BOOL)animated)
{
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
    [RCTSharedApplication() setStatusBarStyle:statusBarStyle
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
    [RCTSharedApplication() setStatusBarHidden:hidden
                                 withAnimation:animation];
  }
}

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible:(BOOL)visible)
{
  RCTSharedApplication().networkActivityIndicatorVisible = visible;
}

#endif //TARGET_OS_TV

@end
