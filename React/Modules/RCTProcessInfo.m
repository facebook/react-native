/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTProcessInfo.h"

@implementation RCTProcessInfo

RCT_EXPORT_MODULE()

- (NSDictionary *)constantsToExport
{
  NSProcessInfo *processInfo = [NSProcessInfo processInfo];
  return
  @{
    @"environment": processInfo.environment,
    @"arguments": processInfo.arguments,
    };
}

@end
