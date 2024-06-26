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

@implementation CommonHostMetadata
@end

@implementation RCTInspectorUtils

+ (CommonHostMetadata *)getHostMetadata
{
  UIDevice *device = [UIDevice currentDevice];
  auto version = RCTGetReactNativeVersion();

  CommonHostMetadata *metadata = [[CommonHostMetadata alloc] init];

  metadata.appIdentifier = [[NSBundle mainBundle] bundleIdentifier];
  metadata.platform = RCTPlatformName;
  metadata.deviceName = [device name];
  metadata.reactNativeVersion =
      [NSString stringWithFormat:@"%i.%i.%i%@",
                                 [version[@"minor"] intValue],
                                 [version[@"major"] intValue],
                                 [version[@"patch"] intValue],
                                 [version[@"prerelease"] isKindOfClass:[NSNull class]]
                                     ? @""
                                     : [@"-" stringByAppendingString:[version[@"prerelease"] stringValue]]];

  return metadata;
}

@end
