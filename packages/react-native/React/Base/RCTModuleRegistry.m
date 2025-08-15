/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTTurboModuleRegistry.h"

@class RCTBridgeModule;

@implementation RCTModuleRegistry {
  __weak id<RCTTurboModuleRegistry> _turboModuleRegistry;
#ifndef RCT_FIT_RM_OLD_RUNTIME
  __weak RCTBridge *_bridge;
#endif // RCT_FIT_RM_OLD_RUNTIME
}

#ifndef RCT_FIT_RM_OLD_RUNTIME
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}
#endif // RCT_FIT_RM_OLD_RUNTIME

- (void)setTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
  _turboModuleRegistry = turboModuleRegistry;
}

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName lazilyLoadIfNecessary:YES];
}

- (id)moduleForName:(const char *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  id<RCTBridgeModule> module = nil;

#ifndef RCT_FIT_RM_OLD_RUNTIME
  RCTBridge *bridge = _bridge;
  if (bridge) {
    module = [bridge moduleForName: [NSString stringWithUTF8String:moduleName] lazilyLoadIfNecessary:lazilyLoad];
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  id<RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
  if (module == nil && turboModuleRegistry && (lazilyLoad || [turboModuleRegistry moduleIsInitialized:moduleName])) {
    module = [turboModuleRegistry moduleForName:moduleName];
  }

  return module;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
#ifndef RCT_FIT_RM_OLD_RUNTIME
  RCTBridge *bridge = _bridge;

  if (bridge) {
    return [bridge moduleIsInitialized:moduleClass];
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  id<RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
  if (turboModuleRegistry) {
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);
    return [turboModuleRegistry moduleIsInitialized:[moduleName UTF8String]];
  }

  return NO;
}

- (id)moduleForClass:(Class)moduleClass
{
  return [self moduleForName:RCTBridgeModuleNameForClass(moduleClass).UTF8String];
}

@end
