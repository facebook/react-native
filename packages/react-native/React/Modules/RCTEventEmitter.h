/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

/**
 * RCTEventEmitter is an abstract base class to be used for modules that emit
 * events to be observed by JS.
 */
@interface RCTEventEmitter : NSObject <RCTBridgeModule, RCTInvalidating>

@property (nonatomic, weak) RCTBridge * _Nullable bridge; // [macOS]
@property (nonatomic, weak) RCTModuleRegistry * _Nullable moduleRegistry; // [macOS]
@property (nonatomic, weak) RCTViewRegistry * _Nullable viewRegistry_DEPRECATED; // [macOS]

- (instancetype _Nullable)initWithDisabledObservation; // [macOS]

/**
 * Override this method to return an array of supported event names. Attempting
 * to observe or send an event that isn't included in this list will result in
 * an error.
 */
- (NSArray<NSString *> *_Nullable)supportedEvents; // [macOS]

/**
 * Send an event that does not relate to a specific view, e.g. a navigation
 * or data update notification.
 */
- (void)sendEventWithName:(NSString *_Nullable)name body:(id _Nullable )body; // [macOS]

- (BOOL)canSendEvents_DEPRECATED;

/**
 * These methods will be called when the first observer is added and when the
 * last observer is removed (or when dealloc is called), respectively. These
 * should be overridden in your subclass in order to start/stop sending events.
 */
- (void)startObserving;
- (void)stopObserving;

- (void)invalidate NS_REQUIRES_SUPER;

- (void)addListener:(NSString *_Nullable)eventName; // [macOS]
- (void)removeListeners:(double)count;

@end
