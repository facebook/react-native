/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDeviceInfo.h"

#import "RCTAccessibilityManager.h"
#import "RCTAssert.h"
#import "RCTEventDispatcher.h"
#import "RCTUIUtils.h"
#import "RCTUtils.h"

@implementation RCTDeviceInfo

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationDidChangeStatusBarFrame)
                                               name:UIApplicationDidChangeStatusBarFrameNotification
                                             object:nil];
#endif
}

static BOOL RCTIsIPhoneX() {
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    isIPhoneX = CGSizeEqualToSize(
      [UIScreen mainScreen].nativeBounds.size,
      CGSizeMake(1125, 2436)
    );
  });

  return isIPhoneX;
}

static NSDictionary *RCTExportedDimensions(RCTBridge *bridge)
{
  RCTAssertMainQueue();

  RCTDimensions dimensions = RCTGetDimensions(bridge.accessibilityManager.multiplier);
  NSDictionary<NSString *, NSNumber *> *screen = @{
    @"width": @(dimensions.screen.width),
    @"height": @(dimensions.screen.height),
    @"scale": @(dimensions.screen.scale),
    @"fontScale": @(dimensions.screen.fontScale),
  };
  NSDictionary<NSString *, NSNumber *> *window = @{
    @"width": @(dimensions.window.width),
    @"height": @(dimensions.window.height),
    @"scale": @(dimensions.window.scale),
    @"fontScale": @(dimensions.window.fontScale),
  };
  return @{
    @"screen": screen,
    @"window": window,
  };
}

- (void)dealloc
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (void)invalidate
{
  RCTExecuteOnMainQueue(^{
    self->_bridge = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  });
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{
    @"Dimensions": RCTExportedDimensions(_bridge),
    // Note:
    // This prop is deprecated and will be removed in a future release.
    // Please use this only for a quick and temporary solution.
    // Use <SafeAreaView> instead.
    @"isIPhoneX_deprecated": @(RCTIsIPhoneX()),
  };
}

- (void)didReceiveNewContentSizeMultiplier
{
  RCTBridge *bridge = _bridge;
  RCTExecuteOnMainQueue(^{
    // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                        body:RCTExportedDimensions(bridge)];
#pragma clang diagnostic pop
  });
}

#if !TARGET_OS_TV

- (void)applicationDidChangeStatusBarFrame
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                              body:RCTExportedDimensions(_bridge)];
#pragma clang diagnostic pop
}

#endif // TARGET_OS_TV

@end
