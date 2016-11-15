//
//  RCTTVNavigationEventEmitter.m
//  React
//
//  Created by Douglas Lowder on 11/13/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTTVNavigationEventEmitter.h"

NSString *const RCTTVNavigationEventNotification = @"RCTTVNavigationEventNotification";

@implementation RCTTVNavigationEventEmitter

RCT_EXPORT_MODULE()

- (instancetype)init {
  if(self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:RCTTVNavigationEventNotification
                                               object:nil];
    
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onTVNavEvent"];
}

- (void)handleTVNavigationEventNotification:(NSNotification*)notif {
  [self sendEventWithName:@"onTVNavEvent" body:notif.object];
}

@end
