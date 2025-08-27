/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTDevMenuConfigurationDecorator.h>

@implementation RCTDevMenuConfigurationDecorator

- (instancetype)initWithDevMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self = [super init]) {
    _devMenuConfiguration = devMenuConfiguration;
  }
  
  return self;
}

- (void)decorate:(RCTDevMenu *)devMenuModule
{
  if (_devMenuConfiguration != nil) {
    devMenuModule.isDevMenuEnabled = _devMenuConfiguration.isDevMenuEnabled;
    [devMenuModule setShakeToShow:_devMenuConfiguration.isShakeGestureEnabled];
  }
}

@end
