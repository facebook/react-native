/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSourceCode.h"

#import "RCTBridge.h"

@implementation RCTSourceCode

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{
    @"scriptURL": self.bridge.bundleURL.absoluteString ?: @"",
  };
}

@end
