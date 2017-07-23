/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDeviceInfo.h"

#import "RCTAccessibilityManager.h"
#import "RCTAssert.h"
#import "RCTEventDispatcher.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"

@implementation RCTDeviceInfo

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didUpdateDimensions)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didUpdateDimensions)
                                               name:RCTUIManagerDidUpdateAvailableSizeNotification
                                             object:_bridge.uiManager];
}

static NSDictionary *RCTExportedDimensions(RCTBridge *bridge)
{
  RCTAssertMainQueue();

  // Don't use RCTScreenSize since it the interface orientation doesn't apply to it
  CGRect screenSize = [[UIScreen mainScreen] bounds];
  NSDictionary *screenDims = @{
                         @"width": @(screenSize.size.width),
                         @"height": @(screenSize.size.height),
                         @"scale": @(RCTScreenScale()),
                         @"fontScale": @(bridge.accessibilityManager.multiplier)
                         };

  CGRect window = [[UIApplication sharedApplication] keyWindow].rootViewController.view.bounds;
  NSDictionary *windowDims = @{
                         @"width": @(window.size.width),
                         @"height": @(window.size.height),
                         @"scale": @(RCTScreenScale()),
                         @"fontScale": @(bridge.accessibilityManager.multiplier)
                         };

  return @{
           @"window": windowDims,
           @"screen": screenDims
           };
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
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  constants[@"Dimensions"] = RCTExportedDimensions(_bridge);
  return constants;
}

- (void)didUpdateDimensions
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

@end
