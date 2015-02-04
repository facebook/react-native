// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

/**
 * All of this will be replaced with an auto-generated bridge.
 */

typedef NS_ENUM(NSUInteger, RCTJSModuleIDs) {
  RCTModuleIDReactIOSEventEmitter,
  RCTModuleIDJSTimers,  // JS timer tracking module
  RCTModuleIDReactIOS,
  RCTModuleIDBundler,
  RCTModuleIDDimensions,
  RCTModuleIDDeviceEventEmitter,
  RCTModuleIDNativeAppEventEmitter,
};

/**
 * JS module `RCTIOSEventEmitter`.
 */
typedef NS_ENUM(NSUInteger, RCTEventEmitterRemoteMethodIDs) {
  RCTEventEmitterReceiveEvent = 0,
  RCTEventEmitterReceiveTouches
};

typedef NS_ENUM(NSUInteger, RCTKeyCode) {
  RCTKeyCodeBackspace = 8,
  RCTKeyCodeReturn = 13,
};

/**
 * JS timer tracking module.
 */
typedef NS_ENUM(NSUInteger, RCTJSTimersMethodIDs) {
  RCTJSTimersCallTimers = 0
};

typedef NS_ENUM(NSUInteger, RCTReactIOSMethodIDs) {
  RCTReactIOSUnmountComponentAtNodeAndRemoveContainer = 0,
};

typedef NS_ENUM(NSUInteger, RCTBundlerMethodIDs) {
  RCTBundlerRunApplication = 0
};

typedef NS_ENUM(NSUInteger, RCTDimensionsMethodIDs) {
  RCTDimensionsSet = 0
};

typedef NS_ENUM(NSUInteger, RCTDeviceEventEmitterMethodIDs) {
  RCTDeviceEventEmitterEmit = 0
};

@interface RCTModuleIDs : NSObject

+ (NSDictionary *)config;

@end

