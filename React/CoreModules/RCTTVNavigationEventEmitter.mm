/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVNavigationEventEmitter.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import "CoreModulesPlugins.h"

NSString *const RCTTVNavigationEventNotification = @"RCTTVNavigationEventNotification";

static NSString *const TVNavigationEventName = @"onHWKeyEvent";

@interface RCTTVNavigationEventEmitter() <NativeTVNavigationEventEmitterSpec>
@end

@implementation RCTTVNavigationEventEmitter

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:RCTTVNavigationEventNotification
                                               object:nil];

  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[TVNavigationEventName];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
  if (self.bridge) {
    [self sendEventWithName:TVNavigationEventName body:notif.object];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return std::make_shared<facebook::react::NativeTVNavigationEventEmitterSpecJSI>(self, jsInvoker);
}

@end

Class RCTTVNavigationEventEmitterCls(void) {
  return RCTTVNavigationEventEmitter.class;
}
