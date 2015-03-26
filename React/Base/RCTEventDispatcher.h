/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@class RCTBridge;

typedef NS_ENUM(NSInteger, RCTTextEventType) {
  RCTTextEventTypeFocus,
  RCTTextEventTypeBlur,
  RCTTextEventTypeChange,
  RCTTextEventTypeSubmit,
  RCTTextEventTypeEnd
};

typedef NS_ENUM(NSInteger, RCTScrollEventType) {
  RCTScrollEventTypeStart,
  RCTScrollEventTypeMove,
  RCTScrollEventTypeEnd,
  RCTScrollEventTypeStartDeceleration,
  RCTScrollEventTypeEndDeceleration,
  RCTScrollEventTypeEndAnimation,
};

/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface RCTEventDispatcher : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Send an application-specific event that does not relate to a specific
 * view, e.g. a navigation or data update notification.
 */
- (void)sendAppEventWithName:(NSString *)name body:(id)body;

/**
 * Send a device or iOS event that does not relate to a specific view,
 * e.g.rotation, location, keyboard show/hide, background/awake, etc.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body;

/**
 * Send a user input event. The body dictionary must contain a "target"
 * parameter, representing the react tag of the view sending the event
 */
- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body;

/**
 * Send a text input/focus event.
 */
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text;

/**
 * Send a scroll event.
 * (You can send a fake scroll event by passing nil for scrollView).
 */
- (void)sendScrollEventWithType:(RCTScrollEventType)type
                       reactTag:(NSNumber *)reactTag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData;

@end
