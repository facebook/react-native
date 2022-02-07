/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

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
