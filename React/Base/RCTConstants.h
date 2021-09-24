/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
 * Remove clipped subviews
 */
RCT_EXTERN BOOL RCTGetRemoveClippedSubviewsEnabled(void);
RCT_EXTERN void RCTSetRemoveClippedSubviewsEnabled(BOOL value);
