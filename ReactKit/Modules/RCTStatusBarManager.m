// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTStatusBarManager.h"

#import "RCTLog.h"

@implementation RCTStatusBarManager

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"] boolValue];
  });
  
  return value;
}

- (void)setStyle:(UIStatusBarStyle)statusBarStyle animated:(BOOL)animated
{
  RCT_EXPORT();
  
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

- (void)setHidden:(BOOL)hidden withAnimation:(UIStatusBarAnimation)animation
{
  RCT_EXPORT();
  
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

+ (NSDictionary *)constantsToExport
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
