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

- (void)getAdvertisingId:(RCTResponseSenderBlock)callback withErrorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  if ([ASIdentifierManager class]) {
    callback(@[[[[ASIdentifierManager sharedManager] advertisingIdentifier] UUIDString]]);
  } else {
    return errorCallback(@[@"as_identifier_unavailable"]);
  }
}

- (void)getAdvertisingTrackingEnabled:(RCTResponseSenderBlock)callback withErrorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  if ([ASIdentifierManager class]) {
    bool hasTracking = [[ASIdentifierManager sharedManager] isAdvertisingTrackingEnabled];
    callback(@[@(hasTracking)]);
  } else {
    return errorCallback(@[@"as_identifier_unavailable"]);
  }
}

@end
