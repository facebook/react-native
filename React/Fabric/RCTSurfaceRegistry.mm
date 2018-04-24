/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceRegistry.h"

#import <mutex>

#import <React/RCTFabricSurface.h>

@implementation RCTSurfaceRegistry {
  std::mutex _mutex;
  NSMapTable<id, RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
  }

  return self;
}

- (void)registerSurface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  std::lock_guard<std::mutex> lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
