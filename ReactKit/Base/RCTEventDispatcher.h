// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTBridge;

typedef NS_ENUM(NSInteger, RCTTouchEventType) {
  RCTTouchEventTypeStart,
  RCTTouchEventTypeMove,
  RCTTouchEventTypeEnd,
  RCTTouchEventTypeCancel
};

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

@interface RCTEventDispatcher : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Send an arbitrary event type
 */
- (void)sendRawEventWithType:(NSString *)eventType body:(NSDictionary *)body;

/**
 * Send an array of touch events
 */
- (void)sendTouchEventWithType:(RCTTouchEventType)type
                       touches:(NSArray *)touches
                changedIndexes:(NSArray *)changedIndexes;

/**
 * Send text events
 */
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text;

/**
 * Send scroll events
 * (You can send a fake scroll event by passing nil for scrollView)
 */
- (void)sendScrollEventWithType:(RCTScrollEventType)type
                       reactTag:(NSNumber *)reactTag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData;

@end
