/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModuleBindingsInstaller.h"

@implementation RCTTurboModuleBindingsInstaller {
  facebook::react::TurboModule::BindingsInstaller _bindingsInstaller;
}

- (instancetype)initWithBindingsInstaller:(facebook::react::TurboModule::BindingsInstaller)bindingsInstaller
{
  if (self = [super init]) {
    _bindingsInstaller = bindingsInstaller;
  }

  return self;
}

- (facebook::react::TurboModule::BindingsInstaller)get
{
  return _bindingsInstaller;
}

@end
