/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>

/**
 * The threshold at which text inputs will start warning that the JS thread
 * has fallen behind (resulting in poor input performance, missed keys, etc.)
 */
RCT_EXTERN const NSInteger RCTTextUpdateLagWarningThreshold;

/**
 * Takes an input event name and normalizes it to the form that is required
 * by the events system (currently that means starting with the "top" prefix,
 * but that's an implementation detail that may change in future).
 */
RCT_EXTERN NSString *RCTNormalizeInputEventName(NSString *eventName);

typedef NS_ENUM(NSInteger, RCTTextEventType) {
  RCTTextEventTypeFocus,
  RCTTextEventTypeBlur,
  RCTTextEventTypeChange,
  RCTTextEventTypeSubmit,
  RCTTextEventTypeEnd,
  RCTTextEventTypeKeyPress
};

@protocol RCTEvent <NSObject>
@required

@property (nonatomic, strong, readonly) NSNumber *viewTag;
@property (nonatomic, copy, readonly) NSString *eventName;

- (BOOL)canCoalesce;

/** used directly for doing a JS call */
+ (NSString *)moduleDotMethod;

/** must contain only JSON compatible values */
- (NSArray *)arguments;

@optional

/**
 * Coalescing related methods must only be implemented if canCoalesce
 * returns YES.
 */
@property (nonatomic, assign, readonly) uint16_t coalescingKey;
- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;

@end

/**
 * This protocol allows observing events dispatched by RCTEventDispatcher.
 */
@protocol RCTEventDispatcherObserver <NSObject>

/**
 * Called before dispatching an event, on the same thread the event was
 * dispatched from.
 */
- (void)eventDispatcherWillDispatchEvent:(id<RCTEvent>)event;

@end

@protocol RCTJSDispatcherModule

@property (nonatomic, copy) void (^dispatchToJSThread)(dispatch_block_t block);

@end

/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@protocol RCTEventDispatcherProtocol <RCTBridgeModule, RCTJSDispatcherModule>

- (void)sendViewEventWithName:(NSString *)name reactTag:(NSNumber *)reactTag;

/**
 * Deprecated, do not use.
 */
- (void)sendAppEventWithName:(NSString *)name body:(id)body __deprecated_msg("Subclass RCTEventEmitter instead");

/**
 * Deprecated, do not use.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body __deprecated_msg("Subclass RCTEventEmitter instead");

/**
 * Send a text input/focus event. For internal use only.
 */
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount;

/**
 * Notify Observers of event
 */
- (void)notifyObserversOfEvent:(id<RCTEvent>)event;

/**
 * Send a pre-prepared event object.
 *
 * Events are sent to JS as soon as the thread is free to process them.
 * If an event can be coalesced and there is another compatible event waiting, the coalescing will happen immediately.
 */
- (void)sendEvent:(id<RCTEvent>)event;

/**
 * Add an event dispatcher observer.
 */
- (void)addDispatchObserver:(id<RCTEventDispatcherObserver>)observer;

/**
 * Remove an event dispatcher observer.
 */
- (void)removeDispatchObserver:(id<RCTEventDispatcherObserver>)observer;

@end

@interface RCTBridge (RCTEventDispatcher)

- (id<RCTEventDispatcherProtocol>)eventDispatcher;

@end
