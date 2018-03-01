/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTI18nManager.h"
#import "RCTI18nUtil.h"

@implementation RCTI18nManager

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[RCTI18nUtil sharedInstance] allowRTL:value];
}

RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[RCTI18nUtil sharedInstance] forceRTL:value];
}

RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"isRTL": @([[RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

@end
