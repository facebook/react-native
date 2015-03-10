// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTAdSupport.h"

#import <AdSupport/ASIdentifierManager.h>

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

@end
