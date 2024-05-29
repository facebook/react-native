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
