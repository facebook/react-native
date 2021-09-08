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
 * Allows to some performance flags to report data synchronously right after the mounting transaction finishes.
 */
RCT_EXTERN BOOL RCTExperimentGetSyncPerformanceFlag(void);
RCT_EXTERN void RCTExperimentSetSyncPerformanceFlag(BOOL value);
