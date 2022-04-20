/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

RCT_EXTERN NSString *const RCTUserInterfaceStyleDidChangeNotification;
RCT_EXTERN NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/*
 * Preemptive View Allocation
 */
RCT_EXTERN BOOL RCTExperimentGetPreemptiveViewAllocationDisabled(void);
RCT_EXTERN void RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);

/*
 * W3C Pointer Events
 */
RCT_EXTERN BOOL RCTGetDispatchW3CPointerEvents(void);
RCT_EXTERN void RCTSetDispatchW3CPointerEvents(BOOL value);

/*
 * Memory Pressure Unloading
 */
RCT_EXTERN BOOL RCTGetDisableBridgeMemoryPressureUnload(void);
RCT_EXTERN void RCTSetDisableBridgeMemoryPressureUnload(BOOL value);

/*
 * Memory Pressure Unloading Level
 */
RCT_EXTERN BOOL RCTGetMemoryPressureUnloadLevel(void);
RCT_EXTERN void RCTSetMemoryPressureUnloadLevel(int value);
