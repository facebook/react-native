/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTabBarManager.h"

#import "RCTBridge.h"
#import "RCTTabBar.h"
#import "RCTUIManager.h"
#import "RCTUIManagerObserverCoordinator.h"

@implementation RCTConvert (UITabBar)

RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@interface RCTTabBarManager () <RCTUIManagerObserver>

@end

@implementation RCTTabBarManager
{
  // The main thread only.
  NSHashTable<RCTTabBar *> *_viewRegistry;
}

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  RCTTabBar *view = [RCTTabBar new];
  [_viewRegistry addObject:view];
  return view;
}

RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
#if !TARGET_OS_TV
RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

#pragma mark - RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused RCTUIManager *)manager
{
  RCTExecuteOnMainQueue(^{
    for (RCTTabBar *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
