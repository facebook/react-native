// Copyright 2004-present Facebook. All Rights Reserved.

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
