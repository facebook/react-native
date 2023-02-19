/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]
#if TARGET_OS_OSX

#import "RCTPlatform.h"

#import <AppKit/AppKit.h>

#import "RCTUtils.h"
#import "RCTVersion.h"

@implementation RCTPlatform

RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSOperatingSystemVersion osVersion = [[NSProcessInfo processInfo] operatingSystemVersion];
  return @{
    @"osVersion": [NSString stringWithFormat:@"%ld.%ld.%ld", osVersion.majorVersion, osVersion.minorVersion, osVersion.patchVersion],
    @"isTesting": @(RCTRunningInTestEnvironment()),
    @"reactNativeVersion": RCTGetReactNativeVersion(),
  };
}

Class RCTPlatformCls(void) {
  return RCTPlatform.class;
}

@end
#endif