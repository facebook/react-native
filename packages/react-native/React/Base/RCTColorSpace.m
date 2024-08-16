/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

// The iOS side is kept in synch with the C++ side by using the
// RCTAppDelegate which, at startup, sets the default color space.
// The usage of dispatch_once and of once_flag ensoure that those are
// set only once when the app starts and that they can't change while
// the app is running.
static RCTColorSpace _defaultColorSpace = RCTColorSpaceSRGB;
RCTColorSpace F(void)
{
  return _defaultColorSpace;
}
void RCTSetDefaultColorSpace(RCTColorSpace colorSpace)
{
  _defaultColorSpace = colorSpace;
}