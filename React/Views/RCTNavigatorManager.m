/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNavigatorManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTNavigator.h"
#import "RCTSparseArray.h"
#import "RCTUIManager.h"

@implementation RCTNavigatorManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTNavigator alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)

- (NSDictionary *)customDirectEventTypes
{
  return @{
    @"topNavigationProgress": @{
      @"registrationName": @"onNavigationProgress"
    },
  };
}

// TODO: remove error callbacks
RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(NSNumber *)reactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTNavigator *navigator = viewRegistry[reactTag];
    if ([navigator isKindOfClass:[RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an RCTNavigator", navigator, reactTag);
    }
  }];
}

@end
