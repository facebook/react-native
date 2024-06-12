/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorUtils.h"

#import <React/RCTConstants.h>
#import <React/RCTVersion.h>
#import <UIKit/UIKit.h>

@implementation RCTInspectorUtils

+ (CommonHostMetadata)getHostMetadata
{
  UIDevice *device = [UIDevice currentDevice];

  NSString *appIdentifier = [[NSBundle mainBundle] bundleIdentifier];
  NSString *platform = RCTPlatformName;
  NSString *deviceName = [device name];

  auto version = RCTGetReactNativeVersion();
  NSString *reactNativeVersion =
      [NSString stringWithFormat:@"%i.%i.%i%@",
                                 [version[@"minor"] intValue],
                                 [version[@"major"] intValue],
                                 [version[@"patch"] intValue],
                                 [version[@"prerelease"] isKindOfClass:[NSNull class]]
                                     ? @""
                                     : [@"-" stringByAppendingString:[version[@"prerelease"] stringValue]]];

  return {
      .appIdentifier = [appIdentifier UTF8String],
      .platform = [platform UTF8String],
      .deviceName = [deviceName UTF8String],
      .reactNativeVersion = [reactNativeVersion UTF8String],
  };
}

@end
