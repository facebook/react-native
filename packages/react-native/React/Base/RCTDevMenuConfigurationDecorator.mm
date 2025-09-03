/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTDevMenuConfigurationDecorator.h>

#if RCT_DEV_MENU

#import <React/RCTDevSettings.h>

@implementation RCTDevMenuConfigurationDecorator

- (instancetype)initWithDevMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self = [super init]) {
    _devMenuConfiguration = devMenuConfiguration;
  }

  return self;
}

- (void)decorate:(id<RCTBridgeModule>)bridgeModule
{
  if ([bridgeModule isKindOfClass:[RCTDevMenu class]]) {
    RCTDevMenu *devMenu = (RCTDevMenu *)bridgeModule;
    devMenu.isDevMenuEnabled = _devMenuConfiguration.isDevMenuEnabled;

    if (_devMenuConfiguration.areKeyboardShortcutsEnabled == false) {
      if ([devMenu hotkeysEnabled]) {
        [devMenu setHotkeysEnabled:_devMenuConfiguration.areKeyboardShortcutsEnabled];
      }

      [devMenu disableReloadCommand];
    }
  }

  if ([bridgeModule isKindOfClass:[RCTDevSettings class]]) {
    RCTDevSettings *devSettings = (RCTDevSettings *)bridgeModule;
    [devSettings setIsShakeToShowDevMenuEnabled:_devMenuConfiguration.isShakeGestureEnabled];
  }
}

@end

#else

@implementation RCTDevMenuConfigurationDecorator : NSObject

@end

#endif


