/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTLog.h>

#import "RCTMultiWindowUtils.h"

@implementation RCTMultiWindowRegistry

+ (NSMapTable<id, UIWindow *> *)rnInstanceIdToUIWindowRegistry
{
  static NSMapTable<id, UIWindow *> *registry = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    registry = [NSMapTable weakToWeakObjectsMapTable];
  });
  return registry;
}

+ (void)registerWindow:(UIWindow *)window withRNInstance:(id)rnInstanceId
{
  RCTLogInfo(@"[RCTMultiWindowRegistry] Registering window %p with RN instance id %p", window, rnInstanceId);
  [self.rnInstanceIdToUIWindowRegistry setObject:window forKey:rnInstanceId];
}

// no need for unregisterWindow-like, since the NSMapTable is weak-to-weak

+ (UIWindow *)windowForRNInstance:(id)rnInstanceId
{
  return [self.rnInstanceIdToUIWindowRegistry objectForKey:rnInstanceId];
}

@end
