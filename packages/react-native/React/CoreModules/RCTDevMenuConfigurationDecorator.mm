/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevMenuConfigurationDecorator.h"

#if RCT_DEV_MENU

#import <React/RCTDevMenu.h>
#import <React/RCTDevSettings.h>

@implementation RCTDevMenuConfigurationDecorator

- (instancetype)initWithDevMenuConfiguration:(RCTDevMenuConfiguration *__nullable)devMenuConfiguration
{
  if (self = [super init]) {
    _devMenuConfiguration = devMenuConfiguration;
  }

  return self;
}

- (void)decorate:(id<RCTBridgeModule>)bridgeModule
{
  if (_devMenuConfiguration == nil) {
    return;
  }

  if ([bridgeModule isKindOfClass:[RCTDevMenu class]]) {
    RCTDevMenu *devMenu = (RCTDevMenu *)bridgeModule;
    devMenu.devMenuEnabled = _devMenuConfiguration.devMenuEnabled;
    devMenu.keyboardShortcutsEnabled = _devMenuConfiguration.keyboardShortcutsEnabled;
  }

  if ([bridgeModule isKindOfClass:[RCTDevSettings class]]) {
    RCTDevSettings *devSettings = (RCTDevSettings *)bridgeModule;
    devSettings.isShakeGestureEnabled = _devMenuConfiguration.shakeGestureEnabled;
  }
}

@end

#else

@implementation RCTDevMenuConfigurationDecorator : NSObject

@end

#endif
