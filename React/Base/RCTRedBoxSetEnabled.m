/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBoxSetEnabled.h"

#if RCT_DEV && DEBUG // [macOS] RCT_DEV is always on in the react-native-macos fork, so to not default to redboxing in release builds, trigger the initial value off of the scheme as well
static BOOL redBoxEnabled = YES;
#else
static BOOL redBoxEnabled = NO;
#endif

void RCTRedBoxSetEnabled(BOOL enabled)
{
  redBoxEnabled = enabled;
}

BOOL RCTRedBoxGetEnabled()
{
  return redBoxEnabled;
}
