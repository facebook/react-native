/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

NSString *const RCTPlatformName = @"ios";

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

NSString *const RCTWindowFrameDidChangeNotification = @"RCTWindowFrameDidChangeNotification";

NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptWillStartExecutingNotification = @"RCTJavaScriptWillStartExecutingNotification";
NSString *const RCTJavaScriptWillStartLoadingNotification = @"RCTJavaScriptWillStartLoadingNotification";

NSString *const RCTDidInitializeModuleNotification = @"RCTDidInitializeModuleNotification";

/*
 * W3C Pointer Events
 */
static BOOL RCTDispatchW3CPointerEvents = NO;

BOOL RCTGetDispatchW3CPointerEvents(void)
{
  return RCTDispatchW3CPointerEvents;
}

void RCTSetDispatchW3CPointerEvents(BOOL value)
{
  RCTDispatchW3CPointerEvents = value;
}

/*
 * Validate RCTEventEmitter. For experimentation only.
 */
static BOOL RCTValidateCanSendEventInRCTEventEmitter = NO;

BOOL RCTGetValidateCanSendEventInRCTEventEmitter(void)
{
  return RCTValidateCanSendEventInRCTEventEmitter;
}

void RCTSetValidateCanSendEventInRCTEventEmitter(BOOL value)
{
  RCTValidateCanSendEventInRCTEventEmitter = value;
}

/*
 * Memory Pressure Unloading Level for experimentation only.
 * Default is 15, which is TRIM_MEMORY_RUNNING_CRITICAL.
 */
static int RCTMemoryPressureUnloadLevel = 15;

int RCTGetMemoryPressureUnloadLevel(void)
{
  return RCTMemoryPressureUnloadLevel;
}

void RCTSetMemoryPressureUnloadLevel(int value)
{
  RCTMemoryPressureUnloadLevel = value;
}

/*
 * In Bridge mode, parse the JS stack for unhandled JS errors, to display in RedBox.
 * When false (previous default behavior), a native stack is displayed in the RedBox.
 */
static BOOL RCTParseUnhandledJSErrorStackNatively = NO;

BOOL RCTGetParseUnhandledJSErrorStackNatively(void)
{
  return RCTParseUnhandledJSErrorStackNatively;
}

void RCTSetParseUnhandledJSErrorStackNatively(BOOL value)
{
  RCTParseUnhandledJSErrorStackNatively = value;
}

/*
 * Use native view configs in bridgeless mode
 */
static BOOL RCTUseNativeViewConfigsInBridgelessMode = NO;

BOOL RCTGetUseNativeViewConfigsInBridgelessMode(void)
{
  return RCTUseNativeViewConfigsInBridgelessMode;
}

void RCTSetUseNativeViewConfigsInBridgelessMode(BOOL value)
{
  RCTUseNativeViewConfigsInBridgelessMode = value;
}
