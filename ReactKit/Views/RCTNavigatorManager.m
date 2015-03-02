// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTNavigatorManager.h"

#import "RCTConvert.h"
#import "RCTNavigator.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTUIManager.h"

@implementation RCTNavigatorManager

- (UIView *)view
{
  return [[RCTNavigator alloc] initWithEventDispatcher:self.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack)

- (NSDictionary *)customDirectEventTypes
{
  return @{
    @"topNavigationProgress": @{
      @"registrationName": @"onNavigationProgress"
    },
  };
}

// TODO: remove error callbacks
- (void)requestSchedulingJavaScriptNavigation:(NSNumber *)reactTag
                                errorCallback:(RCTResponseSenderBlock)errorCallback
                                     callback:(__unused RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    if (reactTag) {
      RCTNavigator *navigator = viewRegistry[reactTag];
      if ([navigator isKindOfClass:[RCTNavigator class]]) {
        BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
        callback(@[@(wasAcquired)]);
      } else {
        RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an RCTNavigator", navigator, reactTag);
      }
    } else {
      RCTLogError(@"Tag not specified for requestSchedulingJavaScriptNavigation");
    }
  }];
}

@end
