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

/*
 * Initial maximum surface size
 */
static BOOL RCTInitialMaxSizeEnabled = NO;

BOOL RCTGetInitialMaxSizeEnabled()
{
  return RCTInitialMaxSizeEnabled;
}

void RCTSetInitialMaxSizeEnabled(BOOL value)
{
  RCTInitialMaxSizeEnabled = value;
}

/*
 * Remove clipped subviews
 */
static BOOL RCTRemoveClippedSubviewsEnabled = NO;

BOOL RCTGetRemoveClippedSubviewsEnabled(void)
{
  return RCTRemoveClippedSubviewsEnabled;
}

void RCTSetRemoveClippedSubviewsEnabled(BOOL value)
{
  RCTRemoveClippedSubviewsEnabled = value;
}
