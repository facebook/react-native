/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPlatform.h"

#import <UIKit/UIKit.h>

#import "RCTUtils.h"

@implementation RCTPlatform

static NSString *interfaceIdiom(UIUserInterfaceIdiom idiom) {
  switch(idiom) {
    case UIUserInterfaceIdiomPhone:
      return @"phone";
    case UIUserInterfaceIdiomPad:
      return @"pad";
    case UIUserInterfaceIdiomTV:
      return @"tv";
    case UIUserInterfaceIdiomCarPlay:
      return @"carplay";
    default:
      return @"unknown";
  }
}

RCT_EXPORT_MODULE(IOSConstants)

- (NSDictionary<NSString *, id> *)constantsToExport
{
  UIDevice *device = [UIDevice currentDevice];
  return @{
    @"forceTouchAvailable": @(RCTForceTouchAvailable()),
    @"osVersion": [device systemVersion],
    @"systemName": [device systemName],
    // userInterfaceIdiom should return UIUserInterfaceIdiomTV if and only if we are running on Apple TV.
    // If this ever changes, we may need to adjust this code to avoid breakage when running on tvOS.
    @"interfaceIdiom": interfaceIdiom([device userInterfaceIdiom]),
  };
}

@end
