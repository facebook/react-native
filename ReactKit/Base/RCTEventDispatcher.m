/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTEventDispatcher.h"

#import "RCTAssert.h"
#import "RCTBridge.h"

@implementation RCTEventDispatcher
{
  RCTBridge __weak *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

+ (NSArray *)JSMethods
{
  return @[
    @"RCTNativeAppEventEmitter.emit",
    @"RCTDeviceEventEmitter.emit",
    @"RCTEventEmitter.receiveEvent",
  ];
}

- (void)sendAppEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTNativeAppEventEmitter.emit"
                    args:body ? @[name, body] : @[name]];
}

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                    args:body ? @[name, body] : @[name]];
}

- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body
{
  RCTAssert([body[@"target"] isKindOfClass:[NSNumber class]],
    @"Event body dictionary must include a 'target' property containing a react tag");

  [_bridge enqueueJSCall:@"RCTEventEmitter.receiveEvent"
                    args:body ? @[body[@"target"], name, body] : @[body[@"target"], name]];
}

- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
{
  static NSString *events[] = {
    @"topFocus",
    @"topBlur",
    @"topChange",
    @"topSubmitEditing",
    @"topEndEditing",
  };

  [self sendInputEventWithName:events[type] body:text ? @{
    @"text": text,
    @"target": reactTag
  } : @{
    @"target": reactTag
  }];
}

/**
 * TODO: throttling
 * NOTE: the old system used a per-scrollview throttling
 * which would be fairly easy to re-implement if needed,
 * but this is non-optimal as it leads to degradation in
 * scroll responsiveness. A better solution would be to
 * coalesce multiple scroll events into a single batch.
 */
- (void)sendScrollEventWithType:(RCTScrollEventType)type
                       reactTag:(NSNumber *)reactTag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData
{
  static NSString *events[] = {
    @"topScrollBeginDrag",
    @"topScroll",
    @"topScrollEndDrag",
    @"topMomentumScrollBegin",
    @"topMomentumScrollEnd",
    @"topScrollAnimationEnd",
  };

  NSDictionary *body = @{
    @"contentOffset": @{
      @"x": @(scrollView.contentOffset.x),
      @"y": @(scrollView.contentOffset.y)
    },
    @"contentSize": @{
      @"width": @(scrollView.contentSize.width),
      @"height": @(scrollView.contentSize.height)
    },
    @"layoutMeasurement": @{
      @"width": @(scrollView.frame.size.width),
      @"height": @(scrollView.frame.size.height)
    },
    @"zoomScale": @(scrollView.zoomScale ?: 1),
    @"target": reactTag
  };

  if (userData) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    [mutableBody addEntriesFromDictionary:userData];
    body = mutableBody;
  }

  [self sendInputEventWithName:events[type] body:body];
}

@end
