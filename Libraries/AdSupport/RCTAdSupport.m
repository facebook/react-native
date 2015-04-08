/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAdSupport.h"

@implementation RCTAdSupport

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getAdvertisingId:(RCTResponseSenderBlock)callback
                  withErrorCallback:(RCTResponseSenderBlock)errorCallback)
{
  if ([ASIdentifierManager class]) {
    callback(@[[[[ASIdentifierManager sharedManager] advertisingIdentifier] UUIDString]]);
  } else {
    return errorCallback(@[@"as_identifier_unavailable"]);
  }
}

RCT_EXPORT_METHOD(getAdvertisingTrackingEnabled:(RCTResponseSenderBlock)callback
                  withErrorCallback:(RCTResponseSenderBlock)errorCallback)
{
  if ([ASIdentifierManager class]) {
    BOOL hasTracking = [[ASIdentifierManager sharedManager] isAdvertisingTrackingEnabled];
    callback(@[@(hasTracking)]);
  } else {
    return errorCallback(@[@"as_identifier_unavailable"]);
  }
}

@end
