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
  RCTModuleIDRenderingPerf,
};

/**
 * JS module `RCTIOSEventEmitter`.
 */
typedef NS_ENUM(NSUInteger, RCTEventEmitterRemoteMethodIDs) {
  RCTEventEmitterReceiveEvent = 0,
  RCTEventEmitterReceiveTouches
};

/**
 * `RCTEventEmitter`: Encoding of parameters.
 */
typedef NS_ENUM(NSUInteger, RCTEventType) {
  RCTEventTap = 1,
  RCTEventVisibleCellsChange,
  RCTEventNavigateBack,
  RCTEventNavRightButtonTap,
  RCTEventChange,
  RCTEventTextFieldDidFocus,
  RCTEventTextFieldWillBlur,
  RCTEventTextFieldSubmitEditing,
  RCTEventTextFieldEndEditing,
  RCTEventTextInput,
  RCTEventLongPress,
  RCTEventTouchStart,
  RCTEventTouchMove,
  RCTEventTouchCancel,
  RCTEventTouchEnd,
  RCTEventScrollBeginDrag,
  RCTEventScroll,
  RCTEventScrollEndDrag,
  RCTEventSelectionChange,
  RCTEventMomentumScrollBegin,
  RCTEventMomentumScrollEnd,
  RCTEventPullToRefresh,
  RCTEventScrollAnimationEnd,
  RCTEventLoadingStart,
  RCTEventLoadingFinish,
  RCTEventLoadingError,
  RCTEventNavigationProgress,
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

typedef NS_ENUM(NSUInteger, RCTRenderingPerfMethodIDs) {
  RCTRenderingPerfToggle = 0,
};

typedef NS_ENUM(NSUInteger, RCTDeviceEventEmitterMethodIDs) {
  RCTDeviceEventEmitterEmit = 0
};

typedef NS_ENUM(NSUInteger, RCTNativeAppEventEmitterMethodIDs) {
  RCTNativeAppEventEmitterEmit = 0
};

@interface RCTModuleIDs : NSObject

+ (NSDictionary *)config;

@end

