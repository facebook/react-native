/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNavigatorManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTNavigator.h"
#import "RCTUIManager.h"
#import "RCTUIManagerObserverCoordinator.h"
#import "UIView+React.h"

@interface RCTNavigatorManager () <RCTUIManagerObserver>

@end

@implementation RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<RCTNavigator *> *_viewRegistry;
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

  RCTNavigator *view = [[RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)reactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTNavigator *> *viewRegistry){
    RCTNavigator *navigator = viewRegistry[reactTag];
    if ([navigator isKindOfClass:[RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an RCTNavigator", navigator, reactTag);
    }
  }];
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused RCTUIManager *)manager
{
  RCTExecuteOnMainQueue(^{
    for (RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
