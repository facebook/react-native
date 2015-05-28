/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridge.h"

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

@protocol RCTEvent <NSObject>

@required

@property (nonatomic, strong, readonly) NSNumber *viewTag;
@property (nonatomic, copy, readonly) NSString *eventName;
@property (nonatomic, copy, readonly) NSDictionary *body;
@property (nonatomic, assign, readonly) uint16_t coalescingKey;

- (BOOL)canCoalesce;
- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;

+ (NSString *)moduleDotMethod;

@end

@interface RCTBaseEvent : NSObject <RCTEvent>

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      eventName:(NSString *)eventName
                           body:(NSDictionary *)body NS_DESIGNATED_INITIALIZER;

@end

/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface RCTEventDispatcher : NSObject

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
 * parameter, representing the React tag of the view sending the event
 */
- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body;

/**
 * Send a text input/focus event.
 */
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text;

- (void)sendEvent:(id<RCTEvent>)event;

@end
