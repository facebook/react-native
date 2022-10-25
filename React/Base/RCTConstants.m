/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptWillStartExecutingNotification = @"RCTJavaScriptWillStartExecutingNotification";
NSString *const RCTJavaScriptWillStartLoadingNotification = @"RCTJavaScriptWillStartLoadingNotification";

NSString *const RCTDidInitializeModuleNotification = @"RCTDidInitializeModuleNotification";
NSString *const RCTDidSetupModuleNotification = @"RCTDidSetupModuleNotification";
NSString *const RCTDidSetupModuleNotificationModuleNameKey = @"moduleName";
NSString *const RCTDidSetupModuleNotificationSetupTimeKey = @"setupTime";

/*
 * W3C Pointer Events
 */
static BOOL RCTDispatchW3CPointerEvents = NO;

BOOL RCTGetDispatchW3CPointerEvents()
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

BOOL RCTGetValidateCanSendEventInRCTEventEmitter()
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

BOOL RCTGetMemoryPressureUnloadLevel()
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

BOOL RCTGetParseUnhandledJSErrorStackNatively()
{
  return RCTParseUnhandledJSErrorStackNatively;
}

void RCTSetParseUnhandledJSErrorStackNatively(BOOL value)
{
  RCTParseUnhandledJSErrorStackNatively = value;
}
