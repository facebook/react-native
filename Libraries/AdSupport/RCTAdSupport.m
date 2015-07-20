/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <AdSupport/ASIdentifierManager.h>

#import "RCTAdSupport.h"
#import "RCTUtils.h"

@implementation RCTAdSupport

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getAdvertisingId:(RCTResponseSenderBlock)callback
                  withErrorCallback:(RCTResponseErrorBlock)errorCallback)
{
  NSUUID *advertisingIdentifier = [ASIdentifierManager sharedManager].advertisingIdentifier;
  if (advertisingIdentifier) {
    callback(@[advertisingIdentifier.UUIDString]);
  } else {
    errorCallback(RCTErrorWithMessage(@"Advertising identifier is unavailable."));
  }
}

RCT_EXPORT_METHOD(getAdvertisingTrackingEnabled:(RCTResponseSenderBlock)callback
                  withErrorCallback:(__unused RCTResponseSenderBlock)errorCallback)
{
  callback(@[@([ASIdentifierManager sharedManager].advertisingTrackingEnabled)]);
}

@end
