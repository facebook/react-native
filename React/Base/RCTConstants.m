/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

/*
 * On-demand view mounting
 */
static BOOL RCTExperimentOnDemandViewMounting = NO;

BOOL RCTExperimentGetOnDemandViewMounting()
{
  return RCTExperimentOnDemandViewMounting;
}

void RCTExperimentSetOnDemandViewMounting(BOOL value)
{
  RCTExperimentOnDemandViewMounting = value;
}

/*
 * Send scroll events to Paper.
 */
static BOOL RCTExperimentSendScrollEventToPaper = YES;

BOOL RCTExperimentGetSendScrollEventToPaper()
{
  return RCTExperimentSendScrollEventToPaper;
}

void RCTExperimentSetSendScrollEventToPaper(BOOL value)
{
  RCTExperimentSendScrollEventToPaper = value;
}

/*
 * Enable fix for data race between state and scroll event.
 */
static BOOL RCTExperimentScrollViewEventRaceFix = NO;

BOOL RCTExperimentGetScrollViewEventRaceFix()
{
  return RCTExperimentScrollViewEventRaceFix;
}

void RCTExperimentSetScrollViewEventRaceFix(BOOL value)
{
  RCTExperimentScrollViewEventRaceFix = value;
}

/*
 * Preemptive View Allocation
 */
static BOOL RCTExperimentPreemptiveViewAllocationDisabled = NO;

BOOL RCTExperimentGetPreemptiveViewAllocationDisabled()
{
  return RCTExperimentPreemptiveViewAllocationDisabled;
}

void RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value)
{
  RCTExperimentPreemptiveViewAllocationDisabled = value;
}
