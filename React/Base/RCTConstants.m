/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

static BOOL RCTExperimentOnDemandViewMounting = NO;

BOOL RCTExperimentGetOnDemandViewMounting()
{
  return RCTExperimentOnDemandViewMounting;
}

void RCTExperimentSetOnDemandViewMounting(BOOL value)
{
  RCTExperimentOnDemandViewMounting = value;
}

static BOOL RCTExperimentSyncPerformanceFlag = NO;

BOOL RCTExperimentGetSyncPerformanceFlag()
{
  return RCTExperimentSyncPerformanceFlag;
}

void RCTExperimentSetSyncPerformanceFlag(BOOL value)
{
  RCTExperimentSyncPerformanceFlag = value;
}
