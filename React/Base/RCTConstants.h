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
 * Allows to enable or disable on-demand view mounting feature of ScrollView.
 * It's an experimental feature that improves performance and memory footprint of huge lists inside ScrollView.
 */
RCT_EXTERN BOOL RCTExperimentGetOnDemandViewMounting(void);
RCT_EXTERN void RCTExperimentSetOnDemandViewMounting(BOOL value);

/*
 * It's an experimental feature that improves performance of hit-testing.
 */
RCT_EXTERN BOOL RCTExperimentGetOptimizedHitTesting(void);
RCT_EXTERN void RCTExperimentSetOptimizedHitTesting(BOOL value);

/*
 * Preemptive View Allocation
 */
RCT_EXTERN BOOL RCTExperimentGetPreemptiveViewAllocationDisabled(void);
RCT_EXTERN void RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);
