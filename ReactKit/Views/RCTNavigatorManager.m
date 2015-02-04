// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTNavigatorManager.h"

#import "RCTConvert.h"
#import "RCTNavigator.h"
#import "RCTShadowView.h"

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

@end

